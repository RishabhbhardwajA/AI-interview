import { Router, Request, Response } from "express";
import User from "../../src/models/User";
import { authenticateToken, requireRole } from "../middleware/auth";

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

export default router;
