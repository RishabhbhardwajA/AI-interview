import { Router, Request, Response } from "express";
import User from "../../src/models/User";
import Interview from "../../src/models/Interview";
import { authenticateToken } from "../middleware/auth";
import { evaluatePlacementReadiness } from "../../src/lib/groq";

const router = Router();
router.use(authenticateToken);

// GET /api/readiness - get history
router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const authUser = req.user!;
        const user = await User.findById(authUser.userId).select("experienceLevel readinessHistory");
        if (!user) { res.status(404).json({ error: "User not found" }); return; }

        res.json({ experienceLevel: user.experienceLevel, readinessHistory: user.readinessHistory || [] });
    } catch (error: any) {
        console.error(`[Readiness API Error]:`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/readiness - generate new assessment
router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const authUser = req.user!;
        const user = await User.findById(authUser.userId);
        if (!user) { res.status(404).json({ error: "User not found" }); return; }

        const { experienceLevel, resumeAnalysisText } = req.body;
        if (experienceLevel) {
            user.experienceLevel = experienceLevel;
            await user.save();
        }

        const interviews = await Interview.find({ userId: authUser.userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("topic score averageScore peakDifficulty status")
            .lean();

        const interviewStr = interviews.map((i: any) =>
            `Topic: ${i.topic} | Avg Score: ${i.averageScore}/10 | Peak Difficulty: ${i.peakDifficulty}/5 | Status: ${i.status}`
        ).join("\n");

        const resumeAnalysisStr = resumeAnalysisText || "No resume analysis provided for this candidate.";
        const evaluation = await evaluatePlacementReadiness(user.experienceLevel, resumeAnalysisStr, interviewStr);

        user.readinessHistory.push({
            score: evaluation.score,
            category: evaluation.category,
            roadmap: evaluation.roadmap,
            weakAreas: evaluation.weakAreas,
            missingSkills: evaluation.missingSkills,
            createdAt: new Date(),
        });

        await user.save();
        res.json({ message: "Placement readiness evaluated", evaluation, experienceLevel: user.experienceLevel });
    } catch (error: any) {
        console.error(`[Readiness API Error]:`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
