import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import Interview from "@/models/Interview";
import { getUserFromRequest, errorResponse, successResponse } from "@/middleware/auth";
import { generateCompanyQuestion, evaluateCompanyAnswer } from "@/lib/groq";
import { getCompanyProfile, getCustomCompanyPromptContext } from "@/lib/companyProfiles";

// POST /api/recruiter — Start or answer a company-specific interview
export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const user = getUserFromRequest(req);
        if (!user) {
            return errorResponse("Unauthorized", 401);
        }

        const body = await req.json();
        const { action } = body;

        if (action === "start") {
            const { company, topic = "", totalQuestions = 10 } = body;

            if (!company) {
                return errorResponse("Company is required", 400);
            }

            const profile = getCompanyProfile(company);
            const companyName = profile?.name || company;
            const interviewStyle = profile?.interviewStyle || getCustomCompanyPromptContext(company);
            const focusAreas = profile?.focusAreas || [];
            const questionPatterns = profile?.questionPatterns || [];
            const startDifficulty = profile?.difficultyRange?.min || 2;

            const initialQuestion = await generateCompanyQuestion(
                companyName,
                interviewStyle,
                focusAreas,
                questionPatterns,
                topic,
                startDifficulty,
                []
            );

            const interview = await Interview.create({
                userId: user.userId,
                topic: topic || `${companyName} Interview`,
                totalQuestions,
                currentDifficulty: startDifficulty,
                company: companyName,
                interviewMode: "recruiter",
                questions: [
                    {
                        question: initialQuestion,
                        difficulty: startDifficulty,
                        answer: "",
                        score: 0,
                        feedback: "",
                        timeTaken: 0,
                        skipped: false,
                    },
                ],
            });

            return successResponse(
                {
                    message: "Recruiter interview started",
                    interview: {
                        id: interview._id,
                        company: companyName,
                        topic: interview.topic,
                        currentQuestion: initialQuestion,
                        currentDifficulty: startDifficulty,
                        questionNumber: 1,
                        totalQuestions,
                        rounds: profile?.rounds || [],
                        tips: profile?.tips || [],
                        passingThreshold: profile?.passingThreshold || 6,
                    },
                },
                201
            );
        }

        if (action === "answer") {
            const { interviewId, answer, timeTaken = 0, skipped = false } = body;

            if (!interviewId) {
                return errorResponse("Interview ID is required", 400);
            }

            const interview = await Interview.findById(interviewId);
            if (!interview) {
                return errorResponse("Interview not found", 404);
            }

            if (interview.status === "completed") {
                return errorResponse("Interview is already completed", 400);
            }

            const companyName = interview.company || "Unknown Company";
            const profile = getCompanyProfile(companyName.toLowerCase());
            const interviewStyle = profile?.interviewStyle || getCustomCompanyPromptContext(companyName);
            const evaluationCriteria = profile?.evaluationCriteria || [];
            const passingThreshold = profile?.passingThreshold || 6;
            const focusAreas = profile?.focusAreas || [];
            const questionPatterns = profile?.questionPatterns || [];

            const currentQuestionIndex = interview.questions.length - 1;
            const currentQuestion = interview.questions[currentQuestionIndex];

            // Build context from previous Q&A
            const context = interview.questions
                .slice(0, -1)
                .map(
                    (q, i) =>
                        `Q${i + 1} (Difficulty: ${q.difficulty}): ${q.question}\nA: ${q.answer} (Score: ${q.score}/10)`
                )
                .join("\n\n");

            let evaluation;
            if (skipped) {
                evaluation = {
                    score: 2,
                    feedback: `Question was skipped. In a ${companyName} interview, skipping questions may raise concerns.`,
                    difficultyAdjustment: "decrease" as const,
                    followUpQuestion: "",
                    keyPointsCovered: [] as string[],
                    areasToImprove: ["Attempt all questions to demonstrate your knowledge"],
                    meetsCompanyBar: false,
                    companySpecificFeedback: `${companyName} expects candidates to attempt every question, even with partial answers.`,
                };
            } else if (!answer || answer.trim().length < 10) {
                evaluation = {
                    score: 1,
                    feedback: "Answer is too short or empty. Please provide a more detailed response.",
                    difficultyAdjustment: "decrease" as const,
                    followUpQuestion: "",
                    keyPointsCovered: [] as string[],
                    areasToImprove: ["Provide more detailed explanations"],
                    meetsCompanyBar: false,
                    companySpecificFeedback: `${companyName} values thorough and well-articulated responses.`,
                };
            } else {
                evaluation = await evaluateCompanyAnswer(
                    currentQuestion.question,
                    answer,
                    companyName,
                    interviewStyle,
                    evaluationCriteria,
                    passingThreshold,
                    interview.topic,
                    interview.currentDifficulty,
                    context
                );
            }

            // Update the current question
            interview.questions[currentQuestionIndex].answer = skipped ? "(Skipped)" : answer;
            interview.questions[currentQuestionIndex].score = evaluation.score;
            interview.questions[currentQuestionIndex].feedback = evaluation.feedback;
            interview.questions[currentQuestionIndex].timeTaken = timeTaken;
            interview.questions[currentQuestionIndex].skipped = skipped;

            // Calculate new difficulty
            const maxDiff = profile?.difficultyRange?.max || 5;
            const minDiff = profile?.difficultyRange?.min || 1;
            let newDifficulty = interview.currentDifficulty;
            if (evaluation.difficultyAdjustment === "increase") {
                newDifficulty = Math.min(maxDiff, newDifficulty + 1);
            } else if (evaluation.difficultyAdjustment === "decrease") {
                newDifficulty = Math.max(minDiff, newDifficulty - 1);
            }

            interview.currentDifficulty = newDifficulty;
            interview.peakDifficulty = Math.max(interview.peakDifficulty, newDifficulty);

            // Check if interview is complete
            const questionNumber = interview.questions.length;
            if (questionNumber >= interview.totalQuestions) {
                interview.status = "completed";
                const totalScore = interview.questions.reduce((sum, q) => sum + q.score, 0);
                interview.totalScore = totalScore;
                interview.averageScore = totalScore / interview.questions.length;

                const questionsAboveBar = interview.questions.filter(q => q.score >= passingThreshold).length;
                const overallMeetsBar = interview.averageScore >= passingThreshold;

                await interview.save();

                return successResponse({
                    message: "Recruiter interview completed",
                    completed: true,
                    evaluation: {
                        score: evaluation.score,
                        feedback: evaluation.feedback,
                        keyPointsCovered: evaluation.keyPointsCovered,
                        areasToImprove: evaluation.areasToImprove,
                        meetsCompanyBar: evaluation.meetsCompanyBar,
                        companySpecificFeedback: evaluation.companySpecificFeedback,
                    },
                    report: {
                        id: interview._id,
                        company: companyName,
                        topic: interview.topic,
                        totalScore: interview.totalScore,
                        averageScore: interview.averageScore,
                        peakDifficulty: interview.peakDifficulty,
                        questions: interview.questions,
                        questionsAboveBar,
                        overallMeetsBar,
                        passingThreshold,
                        verdict: overallMeetsBar
                            ? `✅ You meet ${companyName}'s hiring bar!`
                            : `⚠️ You need improvement to meet ${companyName}'s hiring standards.`,
                    },
                });
            }

            // Generate next question
            const askedQuestions = interview.questions.map((q) => q.question);
            let nextQuestion = evaluation.followUpQuestion;
            if (!nextQuestion) {
                nextQuestion = await generateCompanyQuestion(
                    companyName,
                    interviewStyle,
                    focusAreas,
                    questionPatterns,
                    interview.topic,
                    newDifficulty,
                    askedQuestions
                );
            }

            // Prevent duplicate questions
            let attempts = 0;
            while (askedQuestions.map(q => q.toLowerCase()).includes(nextQuestion.toLowerCase()) && attempts < 3) {
                nextQuestion = await generateCompanyQuestion(
                    companyName,
                    interviewStyle,
                    focusAreas,
                    questionPatterns,
                    interview.topic,
                    newDifficulty,
                    askedQuestions
                );
                attempts++;
            }

            // Add new question
            interview.questions.push({
                question: nextQuestion,
                difficulty: newDifficulty,
                answer: "",
                score: 0,
                feedback: "",
                timeTaken: 0,
                skipped: false,
            });

            await interview.save();

            return successResponse({
                message: "Answer evaluated",
                completed: false,
                evaluation: {
                    score: evaluation.score,
                    feedback: evaluation.feedback,
                    difficultyAdjustment: evaluation.difficultyAdjustment,
                    keyPointsCovered: evaluation.keyPointsCovered,
                    areasToImprove: evaluation.areasToImprove,
                    meetsCompanyBar: evaluation.meetsCompanyBar,
                    companySpecificFeedback: evaluation.companySpecificFeedback,
                },
                nextQuestion,
                currentDifficulty: newDifficulty,
                questionNumber: questionNumber + 1,
                totalQuestions: interview.totalQuestions,
            });
        }

        return errorResponse("Invalid action. Use 'start' or 'answer'.", 400);
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`[Recruiter API Error] ${error.name}: ${error.message}\nStack: ${error.stack}`);
            return errorResponse(error.message, 500);
        }
        console.error("[Recruiter API Error] Unknown error:", error);
        return errorResponse("Internal server error", 500);
    }
}

// GET /api/recruiter — Get recruiter interview history
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const user = getUserFromRequest(req);
        if (!user) {
            return errorResponse("Unauthorized", 401);
        }

        const interviews = await Interview.find({
            userId: user.userId,
            interviewMode: "recruiter",
        })
            .sort({ createdAt: -1 })
            .select("topic company status totalScore averageScore peakDifficulty totalQuestions createdAt questions interviewMode")
            .lean();

        return successResponse({ interviews });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`[Recruiter API GET Error] ${error.name}: ${error.message}\nStack: ${error.stack}`);
            return errorResponse(error.message, 500);
        }
        return errorResponse("Internal server error", 500);
    }
}
