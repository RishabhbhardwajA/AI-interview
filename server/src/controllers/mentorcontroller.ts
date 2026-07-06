import { Router, Request, Response } from "express";
import User from "../models/User";
import { authenticateToken, requireRole } from "../middleware/auth";
import Interview from "../models/Interview";

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);
// Apply mentor/admin role requirement to all routes in this file
router.use(requireRole(["Mentor", "Administrator"]));

// GET /api/mentor/students
router.get("/students", async (req: Request, res: Response): Promise<void> => {
    try {
        // Return users who have role "Student"
        const students = await User.find({ role: "Student" }, { name: 1, experienceLevel: 1, createdAt: 1 });
        res.json({ students });
    } catch (error) {
        console.error("[Mentor Students API Error]:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/mentor/interviews
router.get("/interviews", async (req: Request, res: Response): Promise<void> => {
    try {
        // Find completed interviews, populate the userId to get student's name
        const interviews = await Interview.find({ status: "completed" })
            .populate("userId", "name email")
            .populate("reviewedBy", "name")
            .sort({ createdAt: -1 })
            .lean();
            
        res.json({ interviews });
    } catch (error) {
        console.error("[Mentor Interviews API Error]:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/mentor/interviews/:id/feedback
router.post("/interviews/:id/feedback", async (req: Request, res: Response): Promise<void> => {
    try {
        const interviewId = req.params.id;
        const { feedback } = req.body;
        const mentorId = req.user!.userId;

        if (!feedback) {
            res.status(400).json({ error: "Feedback is required" });
            return;
        }

        const interview = await Interview.findByIdAndUpdate(
            interviewId,
            { 
                mentorFeedback: feedback,
                reviewedBy: mentorId
            },
            { new: true }
        );

        if (!interview) {
            res.status(404).json({ error: "Interview not found" });
            return;
        }

        res.json({ message: "Feedback submitted successfully", interview });
    } catch (error) {
        console.error("[Mentor Feedback API Error]:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
