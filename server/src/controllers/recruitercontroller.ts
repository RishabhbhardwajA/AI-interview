import { Router, Request, Response } from "express";
import Interview from "../models/Interview";
import { authenticateToken } from "../middleware/auth";
import { generateCompanyQuestion, evaluateCompanyAnswer } from "../lib/groq";
import { getCompanyProfile, getCustomCompanyPromptContext } from "../lib/companyProfiles";

const router = Router();
router.use(authenticateToken);

router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const { action } = req.body;

        if (action === "start") {
            const { company, topic = "", totalQuestions = 10 } = req.body;
            if (!company) { res.status(400).json({ error: "Company is required" }); return; }

            const profile = getCompanyProfile(company);
            const companyName = profile?.name || company;
            const interviewStyle = profile?.interviewStyle || getCustomCompanyPromptContext(company);
            const focusAreas = profile?.focusAreas || [];
            const questionPatterns = profile?.questionPatterns || [];
            const startDifficulty = profile?.difficultyRange?.min || 2;

            const initialQuestion = await generateCompanyQuestion(companyName, interviewStyle, focusAreas, questionPatterns, topic, startDifficulty, []);
            
            const interview = await Interview.create({
                userId: user.userId, topic: topic || `${companyName} Interview`, totalQuestions, currentDifficulty: startDifficulty,
                company: companyName, interviewMode: "recruiter", questions: [{ question: initialQuestion, difficulty: startDifficulty, answer: "", score: 0, feedback: "", timeTaken: 0, skipped: false }]
            });

            res.status(201).json({ message: "Recruiter interview started", interview: { id: interview._id, company: companyName, topic: interview.topic, currentQuestion: initialQuestion, currentDifficulty: startDifficulty, questionNumber: 1, totalQuestions, rounds: profile?.rounds || [], tips: profile?.tips || [], passingThreshold: profile?.passingThreshold || 6 } });
            return;
        }

        if (action === "answer") {
            const { interviewId, answer, timeTaken = 0, skipped = false, proctoringWarnings = 0, isCheatingDetected = false } = req.body;
            if (!interviewId) { res.status(400).json({ error: "Interview ID is required" }); return; }

            const interview = await Interview.findById(interviewId);
            if (!interview) { res.status(404).json({ error: "Interview not found" }); return; }
            if (interview.status === "completed") { res.status(400).json({ error: "Interview is already completed" }); return; }

            const companyName = interview.company || "Unknown Company";
            const profile = getCompanyProfile(companyName.toLowerCase());
            const interviewStyle = profile?.interviewStyle || getCustomCompanyPromptContext(companyName);
            const evaluationCriteria = profile?.evaluationCriteria || [];
            const passingThreshold = profile?.passingThreshold || 6;
            const focusAreas = profile?.focusAreas || [];
            const questionPatterns = profile?.questionPatterns || [];

            const currentQuestionIndex = interview.questions.length - 1;
            const currentQuestion = interview.questions[currentQuestionIndex];
            const context = interview.questions.slice(0, -1).map((q: any, i: number) => `Q${i + 1} (Difficulty: ${q.difficulty}): ${q.question}\nA: ${q.answer} (Score: ${q.score}/10)`).join("\n\n");

            let evaluation;
            if (skipped) {
                evaluation = { score: 2, feedback: `Question was skipped. In a ${companyName} interview, skipping questions may raise concerns.`, difficultyAdjustment: "decrease" as const, followUpQuestion: "", keyPointsCovered: [], areasToImprove: ["Attempt all questions to demonstrate your knowledge"], meetsCompanyBar: false, companySpecificFeedback: `${companyName} expects candidates to attempt every question.` };
            } else if (!answer || answer.trim().length < 10) {
                evaluation = { score: 1, feedback: "Answer is too short or empty. Please provide a more detailed response.", difficultyAdjustment: "decrease" as const, followUpQuestion: "", keyPointsCovered: [], areasToImprove: ["Provide more detailed explanations"], meetsCompanyBar: false, companySpecificFeedback: `${companyName} values thorough and well-articulated responses.` };
            } else {
                evaluation = await evaluateCompanyAnswer(currentQuestion.question, answer, companyName, interviewStyle, evaluationCriteria, passingThreshold, interview.topic, interview.currentDifficulty, context);
            }

            interview.questions[currentQuestionIndex].answer = skipped ? "(Skipped)" : answer;
            interview.questions[currentQuestionIndex].score = evaluation.score;
            interview.questions[currentQuestionIndex].feedback = evaluation.feedback;
            interview.questions[currentQuestionIndex].timeTaken = timeTaken;
            interview.questions[currentQuestionIndex].skipped = skipped;

            const maxDiff = profile?.difficultyRange?.max || 5;
            const minDiff = profile?.difficultyRange?.min || 1;
            let newDifficulty = interview.currentDifficulty;
            if (evaluation.difficultyAdjustment === "increase") newDifficulty = Math.min(maxDiff, newDifficulty + 1);
            else if (evaluation.difficultyAdjustment === "decrease") newDifficulty = Math.max(minDiff, newDifficulty - 1);

            interview.currentDifficulty = newDifficulty;
            interview.peakDifficulty = Math.max(interview.peakDifficulty, newDifficulty);
            interview.proctoringWarnings = Math.max(interview.proctoringWarnings || 0, proctoringWarnings);
            if (isCheatingDetected) interview.isCheatingDetected = true;

            const questionNumber = interview.questions.length;
            if (questionNumber >= interview.totalQuestions || isCheatingDetected) {
                interview.status = "completed";
                const totalScore = interview.questions.reduce((sum: any, q: any) => sum + q.score, 0);
                interview.totalScore = totalScore;
                interview.averageScore = totalScore / interview.questions.length;

                const questionsAboveBar = interview.questions.filter((q: any) => q.score >= passingThreshold).length;
                const overallMeetsBar = interview.averageScore >= passingThreshold;
                await interview.save();

                res.json({ message: "Recruiter interview completed", completed: true, evaluation: { score: evaluation.score, feedback: evaluation.feedback, keyPointsCovered: evaluation.keyPointsCovered, areasToImprove: evaluation.areasToImprove, meetsCompanyBar: evaluation.meetsCompanyBar, companySpecificFeedback: evaluation.companySpecificFeedback }, report: { id: interview._id, company: companyName, topic: interview.topic, totalScore: interview.totalScore, averageScore: interview.averageScore, peakDifficulty: interview.peakDifficulty, questions: interview.questions, questionsAboveBar, overallMeetsBar, passingThreshold, verdict: overallMeetsBar ? `✅ You meet ${companyName}'s hiring bar!` : `⚠️ You need improvement to meet ${companyName}'s hiring standards.` } });
                return;
            }

            const askedQuestions = interview.questions.map((q: any) => q.question);
            let nextQuestion = evaluation.followUpQuestion;
            if (!nextQuestion) {
                nextQuestion = await generateCompanyQuestion(companyName, interviewStyle, focusAreas, questionPatterns, interview.topic, newDifficulty, askedQuestions);
            }

            let attempts = 0;
            while (askedQuestions.map((q: any) => q.toLowerCase()).includes(nextQuestion.toLowerCase()) && attempts < 3) {
                nextQuestion = await generateCompanyQuestion(companyName, interviewStyle, focusAreas, questionPatterns, interview.topic, newDifficulty, askedQuestions);
                attempts++;
            }

            interview.questions.push({ question: nextQuestion, difficulty: newDifficulty, answer: "", score: 0, feedback: "", timeTaken: 0, skipped: false });
            await interview.save();

            res.json({ message: "Answer evaluated", completed: false, evaluation: { score: evaluation.score, feedback: evaluation.feedback, difficultyAdjustment: evaluation.difficultyAdjustment, keyPointsCovered: evaluation.keyPointsCovered, areasToImprove: evaluation.areasToImprove, meetsCompanyBar: evaluation.meetsCompanyBar, companySpecificFeedback: evaluation.companySpecificFeedback }, nextQuestion, currentDifficulty: newDifficulty, questionNumber: questionNumber + 1, totalQuestions: interview.totalQuestions });
            return;
        }

        res.status(400).json({ error: "Invalid action. Use 'start' or 'answer'." });
    } catch (error: any) {
        console.error(`[Recruiter API Error]:`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const interviews = await Interview.find({ userId: user.userId, interviewMode: "recruiter" })
            .sort({ createdAt: -1 })
            .select("topic company status totalScore averageScore peakDifficulty totalQuestions createdAt questions interviewMode")
            .lean();
        res.json({ interviews });
    } catch (error: any) {
        console.error(`[Recruiter API GET Error]:`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
