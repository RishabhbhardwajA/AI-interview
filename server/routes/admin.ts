import { Router, Request, Response } from "express";
import User from "../../src/models/User";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);
// Apply admin role requirement to all routes in this file
router.use(requireRole(["Administrator"]));

// GET /api/admin/users
router.get("/users", async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await User.find({}, { name: 1, email: 1, role: 1, createdAt: 1, _id: 1 }).sort({ createdAt: -1 });
        res.json({ users, count: users.length });
    } catch (error) {
        console.error("[Admin Users API Error]:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// PATCH /api/admin/users/:id/role
router.patch("/users/:id/role", async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        const validRoles = ["Student", "Mentor", "Administrator"];
        if (!role || !validRoles.includes(role)) {
            res.status(400).json({ error: "Invalid role provided" });
            return;
        }

        // Prevent admin from removing their own admin role to avoid lockouts
        if (id === req.user?.userId && role !== "Administrator") {
            res.status(403).json({ error: "Cannot revoke your own Administrator privileges" });
            return;
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select("name email role");

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        
        res.json({ message: `Role updated to ${role}`, user });
    } catch (error) {
        console.error("[Admin Update Role API Error]:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
