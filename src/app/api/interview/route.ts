import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import Interview from "@/models/Interview";
import { getUserFromRequest, errorResponse, successResponse } from "@/middleware/auth";
import { evaluateAnswer, generateInitialQuestion } from "@/lib/groq";

// POST /api/interview — Start or answer
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
            const { topic, totalQuestions = 10 } = body;

            if (!topic) {
                return errorResponse("Topic is required", 400);
            }

            const initialQuestion = await generateInitialQuestion(topic, 2);

            const interview = await Interview.create({
                userId: user.userId,
                topic,
                totalQuestions,
                currentDifficulty: 2,
                questions: [
                    {
                        question: initialQuestion,
                        difficulty: 2,
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
                    message: "Interview started",
                    interview: {
                        id: interview._id,
                        topic: interview.topic,
                        currentQuestion: initialQuestion,
                        currentDifficulty: 2,
                        questionNumber: 1,
                        totalQuestions,
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
                // Skipped = weak answer, decrease difficulty
                evaluation = {
                    score: 2,
                    feedback: "Question was skipped. Moving to an easier question.",
                    difficultyAdjustment: "decrease" as const,
                    followUpQuestion: "",
                    keyPointsCovered: [],
                    areasToImprove: ["Try to attempt all questions for better assessment"],
                };
            } else {
                // Check for repeated/empty answers
                if (!answer || answer.trim().length < 10) {
                    evaluation = {
                        score: 1,
                        feedback: "Answer is too short or empty. Please provide a more detailed response.",
                        difficultyAdjustment: "decrease" as const,
                        followUpQuestion: "",
                        keyPointsCovered: [],
                        areasToImprove: ["Provide more detailed explanations"],
                    };
                } else {
                    // Check for repeated answers (similarity with previous answers)
                    const previousAnswers = interview.questions
                        .slice(0, -1)
                        .map((q) => q.answer.toLowerCase());
                    const isRepeated = previousAnswers.some((prevAns) => {
                        if (!prevAns) return false;
                        const words1 = new Set(answer.toLowerCase().split(/\s+/));
                        const words2 = new Set(prevAns.split(/\s+/));
                        const intersection = Array.from(words1).filter((w: unknown) => words2.has(w as string));
                        const similarity = intersection.length / Math.max(words1.size, words2.size);
                        return similarity > 0.8;
                    });

                    if (isRepeated) {
                        evaluation = {
                            score: 2,
                            feedback:
                                "This answer is very similar to a previous response. Try to provide unique insights for each question.",
                            difficultyAdjustment: "decrease" as const,
                            followUpQuestion: "",
                            keyPointsCovered: [],
                            areasToImprove: [
                                "Provide unique answers for each question",
                                "Address the specific aspects asked",
                            ],
                        };
                    } else {
                        evaluation = await evaluateAnswer(
                            currentQuestion.question,
                            answer,
                            interview.topic,
                            interview.currentDifficulty,
                            context
                        );
                    }
                }
            }

            // Update the current question
            interview.questions[currentQuestionIndex].answer = skipped ? "(Skipped)" : answer;
            interview.questions[currentQuestionIndex].score = evaluation.score;
            interview.questions[currentQuestionIndex].feedback = evaluation.feedback;
            interview.questions[currentQuestionIndex].timeTaken = timeTaken;
            interview.questions[currentQuestionIndex].skipped = skipped;

            // Calculate new difficulty
            let newDifficulty = interview.currentDifficulty;
            if (evaluation.difficultyAdjustment === "increase") {
                newDifficulty = Math.min(5, newDifficulty + 1);
            } else if (evaluation.difficultyAdjustment === "decrease") {
                newDifficulty = Math.max(1, newDifficulty - 1);
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

                await interview.save();

                return successResponse({
                    message: "Interview completed",
                    completed: true,
                    evaluation: {
                        score: evaluation.score,
                        feedback: evaluation.feedback,
                        keyPointsCovered: evaluation.keyPointsCovered,
                        areasToImprove: evaluation.areasToImprove,
                    },
                    report: {
                        id: interview._id,
                        topic: interview.topic,
                        totalScore: interview.totalScore,
                        averageScore: interview.averageScore,
                        peakDifficulty: interview.peakDifficulty,
                        questions: interview.questions,
                    },
                });
            }

            // Generate next question
            let nextQuestion = evaluation.followUpQuestion;
            if (!nextQuestion) {
                nextQuestion = await generateInitialQuestion(interview.topic, newDifficulty);
            }

            // Prevent duplicate questions
            const askedQuestions = interview.questions.map((q) => q.question.toLowerCase());
            let attempts = 0;
            while (askedQuestions.includes(nextQuestion.toLowerCase()) && attempts < 3) {
                nextQuestion = await generateInitialQuestion(interview.topic, newDifficulty);
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
            console.error(`[Interview API Error] ${error.name}: ${error.message}\nStack: ${error.stack}`);
            return errorResponse(error.message, 500);
        } else {
            console.error("[Interview API Error] Unknown error:", error);
        }
        return errorResponse("Internal server error", 500);
    }
}

// GET /api/interview — Get interview history
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const user = getUserFromRequest(req);
        if (!user) {
            return errorResponse("Unauthorized", 401);
        }

        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (id) {
            const interview = await Interview.findById(id);
            if (!interview) {
                return errorResponse("Interview not found", 404);
            }
            return successResponse({ interview });
        }

        const interviews = await Interview.find({ userId: user.userId })
            .sort({ createdAt: -1 })
            .select("topic status totalScore averageScore peakDifficulty totalQuestions createdAt questions")
            .lean();

        return successResponse({ interviews });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`[Interview API GET Error] ${error.name}: ${error.message}\nStack: ${error.stack}`);
            return errorResponse(error.message, 500);
        }
        return errorResponse("Internal server error", 500);
    }
}
