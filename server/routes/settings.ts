import { Router, Request, Response } from "express";
import User from "../../src/models/User";
import SecurityLog from "../../src/models/SecurityLog";
import Session from "../../src/models/Session";
import { authenticateToken } from "../middleware/auth";
import * as bcrypt from "bcryptjs";

const router = Router();
router.use(authenticateToken);

function validatePasswordStrength(password: string): { isValid: boolean; error?: string } {
    if (password.length < 8) return { isValid: false, error: "Password must be at least 8 characters" };
    if (!/[A-Z]/.test(password)) return { isValid: false, error: "Password must contain an uppercase letter" };
    if (!/[a-z]/.test(password)) return { isValid: false, error: "Password must contain a lowercase letter" };
    if (!/[0-9]/.test(password)) return { isValid: false, error: "Password must contain a number" };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { isValid: false, error: "Password must contain a special character" };
    return { isValid: true };
}

function getClientInfo(req: Request) {
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
    const deviceInfo = req.headers["user-agent"] || "Unknown Device";
    return { ipAddress, deviceInfo };
}

router.put("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const userPayload = req.user!;
        const { action } = req.body;
        const { ipAddress, deviceInfo } = getClientInfo(req);

        if (action === "change-password") {
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) { res.status(400).json({ error: "Current password and new password are required" }); return; }

            const user = await User.findById(userPayload.userId);
            if (!user) { res.status(404).json({ error: "User not found" }); return; }

            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                await SecurityLog.create({ userId: user._id, event: "password_change_failed", ipAddress, deviceInfo, details: "Incorrect current password provided" });
                res.status(401).json({ error: "Current password is incorrect" });
                return;
            }

            const strength = validatePasswordStrength(newPassword);
            if (!strength.isValid) { res.status(400).json({ error: strength.error || "New password is too weak" }); return; }

            if (user.passwordHistory && user.passwordHistory.length > 0) {
                for (const oldHash of user.passwordHistory.slice(-3)) {
                    const isReused = await bcrypt.compare(newPassword, oldHash);
                    if (isReused) { res.status(400).json({ error: "You cannot reuse any of your last 3 passwords" }); return; }
                }
            }

            user.password = newPassword;
            user.passwordUpdatedAt = new Date();
            await user.save();

            if (user.password) {
                user.passwordHistory.push(user.password);
                if (user.passwordHistory.length > 5) user.passwordHistory = user.passwordHistory.slice(-5);
                await user.save();
            }

            await SecurityLog.create({ userId: user._id, event: "password_changed", ipAddress, deviceInfo });
            res.json({ message: "Password changed successfully" });
            return;
        }

        if (action === "update-profile") {
            const { name, experienceLevel } = req.body;
            const user = await User.findById(userPayload.userId);
            if (!user) { res.status(404).json({ error: "User not found" }); return; }

            if (name) {
                if (name.length < 2 || name.length > 50) { res.status(400).json({ error: "Name must be between 2 and 50 characters" }); return; }
                user.name = name.trim();
            }

            if (experienceLevel) {
                const allowed = ["Fresher", "Internship Seeker", "Experienced"];
                if (!allowed.includes(experienceLevel)) { res.status(400).json({ error: "Invalid experience level" }); return; }
                user.experienceLevel = experienceLevel;
            }

            await user.save();
            await SecurityLog.create({ userId: user._id, event: "profile_updated", ipAddress, deviceInfo });

            res.json({ message: "Profile updated successfully", user: { id: user._id, name: user.name, email: user.email, role: user.role, experienceLevel: user.experienceLevel, isEmailVerified: user.isEmailVerified } });
            return;
        }

        if (action === "delete-account") {
            const { password } = req.body;
            if (!password) { res.status(400).json({ error: "Password is required to delete account" }); return; }

            const user = await User.findById(userPayload.userId);
            if (!user) { res.status(404).json({ error: "User not found" }); return; }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) { res.status(401).json({ error: "Password is incorrect" }); return; }

            await Session.deleteMany({ userId: user._id });
            await SecurityLog.deleteMany({ userId: user._id });
            await User.findByIdAndDelete(user._id);

            res.json({ message: "Account deleted successfully" });
            return;
        }

        res.status(400).json({ error: "Invalid action" });
    } catch (error: any) {
        console.error(`[Settings API Error]:`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const userPayload = req.user!;
        const user = await User.findById(userPayload.userId).select("-password -passwordHistory -verificationToken -resetPasswordToken");
        if (!user) { res.status(404).json({ error: "User not found" }); return; }

        res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, experienceLevel: user.experienceLevel, isEmailVerified: user.isEmailVerified, passwordUpdatedAt: user.passwordUpdatedAt, createdAt: user.createdAt } });
    } catch (error: any) {
        console.error(`[Settings API GET Error]:`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
