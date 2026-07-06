import { Router, Request, Response } from "express";
import Interview from "../../src/models/Interview";
import { authenticateToken } from "../middleware/auth";
import { evaluateAnswer, generateInitialQuestion } from "../../src/lib/groq";

const router = Router();
router.use(authenticateToken);

// POST /api/interview — Start or answer
router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const { action } = req.body;

        if (action === "start") {
            const { topic, totalQuestions = 10 } = req.body;
            if (!topic) { res.status(400).json({ error: "Topic is required" }); return; }

            const initialQuestion = await generateInitialQuestion(topic, 2);
            const interview = await Interview.create({
                userId: user.userId,
                topic,
                totalQuestions,
                currentDifficulty: 2,
                questions: [{ question: initialQuestion, difficulty: 2, answer: "", score: 0, feedback: "", timeTaken: 0, skipped: false }],
            });

            res.status(201).json({ message: "Interview started", interview: { id: interview._id, topic: interview.topic, currentQuestion: initialQuestion, currentDifficulty: 2, questionNumber: 1, totalQuestions } });
            return;
        }

        if (action === "answer") {
            const { interviewId, answer, timeTaken = 0, skipped = false, proctoringWarnings = 0, isCheatingDetected = false } = req.body;
            if (!interviewId) { res.status(400).json({ error: "Interview ID is required" }); return; }

            const interview = await Interview.findById(interviewId);
            if (!interview) { res.status(404).json({ error: "Interview not found" }); return; }
            if (interview.status === "completed") { res.status(400).json({ error: "Interview is already completed" }); return; }

            const currentQuestionIndex = interview.questions.length - 1;
            const currentQuestion = interview.questions[currentQuestionIndex];
            const context = interview.questions.slice(0, -1).map((q: any, i: number) => `Q${i + 1} (Difficulty: ${q.difficulty}): ${q.question}\nA: ${q.answer} (Score: ${q.score}/10)`).join("\n\n");

            let evaluation;
            if (skipped) {
                evaluation = { score: 2, feedback: "Question was skipped. Moving to an easier question.", difficultyAdjustment: "decrease" as const, followUpQuestion: "", keyPointsCovered: [], areasToImprove: ["Try to attempt all questions for better assessment"] };
            } else {
                if (!answer || answer.trim().length < 10) {
                    evaluation = { score: 1, feedback: "Answer is too short or empty. Please provide a more detailed response.", difficultyAdjustment: "decrease" as const, followUpQuestion: "", keyPointsCovered: [], areasToImprove: ["Provide more detailed explanations"] };
                } else {
                    const previousAnswers = interview.questions.slice(0, -1).map((q: any) => q.answer.toLowerCase());
                    const isRepeated = previousAnswers.some((prevAns: string) => {
                        if (!prevAns) return false;
                        const words1 = new Set(answer.toLowerCase().split(/\s+/));
                        const words2 = new Set(prevAns.split(/\s+/));
                        const intersection = Array.from(words1).filter(w => words2.has(w as string));
                        const similarity = intersection.length / Math.max(words1.size, words2.size);
                        return similarity > 0.8;
                    });

                    if (isRepeated) {
                        evaluation = { score: 2, feedback: "This answer is very similar to a previous response. Try to provide unique insights for each question.", difficultyAdjustment: "decrease" as const, followUpQuestion: "", keyPointsCovered: [], areasToImprove: ["Provide unique answers for each question", "Address the specific aspects asked"] };
                    } else {
                        evaluation = await evaluateAnswer(currentQuestion.question, answer, interview.topic, interview.currentDifficulty, context);
                    }
                }
            }

            interview.questions[currentQuestionIndex].answer = skipped ? "(Skipped)" : answer;
            interview.questions[currentQuestionIndex].score = evaluation.score;
            interview.questions[currentQuestionIndex].feedback = evaluation.feedback;
            interview.questions[currentQuestionIndex].timeTaken = timeTaken;
            interview.questions[currentQuestionIndex].skipped = skipped;

            let newDifficulty = interview.currentDifficulty;
            if (evaluation.difficultyAdjustment === "increase") newDifficulty = Math.min(5, newDifficulty + 1);
            else if (evaluation.difficultyAdjustment === "decrease") newDifficulty = Math.max(1, newDifficulty - 1);

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
                await interview.save();

                res.json({ message: "Interview completed", completed: true, evaluation: { score: evaluation.score, feedback: evaluation.feedback, keyPointsCovered: evaluation.keyPointsCovered, areasToImprove: evaluation.areasToImprove }, report: { id: interview._id, topic: interview.topic, totalScore: interview.totalScore, averageScore: interview.averageScore, peakDifficulty: interview.peakDifficulty, questions: interview.questions } });
                return;
            }

            let nextQuestion = evaluation.followUpQuestion;
            if (!nextQuestion) nextQuestion = await generateInitialQuestion(interview.topic, newDifficulty);

            const askedQuestions = interview.questions.map((q: any) => q.question.toLowerCase());
            let attempts = 0;
            while (askedQuestions.includes(nextQuestion.toLowerCase()) && attempts < 3) {
                nextQuestion = await generateInitialQuestion(interview.topic, newDifficulty);
                attempts++;
            }

            interview.questions.push({ question: nextQuestion, difficulty: newDifficulty, answer: "", score: 0, feedback: "", timeTaken: 0, skipped: false });
            await interview.save();

            res.json({ message: "Answer evaluated", completed: false, evaluation: { score: evaluation.score, feedback: evaluation.feedback, difficultyAdjustment: evaluation.difficultyAdjustment, keyPointsCovered: evaluation.keyPointsCovered, areasToImprove: evaluation.areasToImprove }, nextQuestion, currentDifficulty: newDifficulty, questionNumber: questionNumber + 1, totalQuestions: interview.totalQuestions });
            return;
        }

        res.status(400).json({ error: "Invalid action. Use 'start' or 'answer'." });
    } catch (error: any) {
        console.error(`[Interview API Error]:`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/interview
router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const id = req.query.id as string;

        if (id) {
            const interview = await Interview.findById(id);
            if (!interview) { res.status(404).json({ error: "Interview not found" }); return; }
            res.json({ interview });
            return;
        }

        const interviews = await Interview.find({ userId: user.userId })
            .sort({ createdAt: -1 })
            .select("topic status totalScore averageScore peakDifficulty totalQuestions createdAt questions")
            .lean();

        res.json({ interviews });
    } catch (error: any) {
        console.error(`[Interview API GET Error]:`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
