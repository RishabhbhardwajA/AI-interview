import { Router, Request, Response } from "express";
import crypto from "crypto";
import * as bcrypt from "bcryptjs";
import User from "../../src/models/User";
import Session from "../../src/models/Session";
import SecurityLog from "../../src/models/SecurityLog";
import { generateToken, authenticateToken } from "../middleware/auth";

const router = Router();

// Helper for password strength validation
function validatePasswordStrength(password: string): { isValid: boolean; error?: string } {
    if (password.length < 8) return { isValid: false, error: "Password must be at least 8 characters" };
    if (!/[A-Z]/.test(password)) return { isValid: false, error: "Password must contain an uppercase letter" };
    if (!/[a-z]/.test(password)) return { isValid: false, error: "Password must contain a lowercase letter" };
    if (!/[0-9]/.test(password)) return { isValid: false, error: "Password must contain a number" };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { isValid: false, error: "Password must contain a special character" };
    return { isValid: true };
}

// Helper to get client IP and device info
function getClientInfo(req: Request) {
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
    const deviceInfo = req.headers["user-agent"] || "Unknown Device";
    return { ipAddress, deviceInfo };
}

router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, action } = req.body;
        const { ipAddress, deviceInfo } = getClientInfo(req);

        if (action === "login") {
            if (!email || !password) {
                res.status(400).json({ error: "Email and password are required" });
                return;
            }

            const user = await User.findOne({ email });
            if (!user) {
                res.status(401).json({ error: "Invalid email or password" });
                return;
            }

            if (user.lockoutUntil && user.lockoutUntil > new Date()) {
                const waitMins = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
                res.status(403).json({ error: `Account is locked. Please try again in ${waitMins} minutes.` });
                return;
            }

            const isMatch = await user.comparePassword(password);
            
            if (!isMatch) {
                user.failedLoginAttempts += 1;
                await SecurityLog.create({ userId: user._id, event: "login_failed", ipAddress, deviceInfo });

                if (user.failedLoginAttempts >= 5) {
                    user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
                    await SecurityLog.create({ userId: user._id, event: "account_locked", ipAddress, deviceInfo, details: "Account locked after 5 failed attempts" });
                    await user.save();
                    res.status(403).json({ error: "Too many failed attempts. Account locked for 15 minutes." });
                    return;
                }
                
                await user.save();
                res.status(401).json({ error: "Invalid email or password" });
                return;
            }

            user.failedLoginAttempts = 0;
            user.lockoutUntil = undefined;
            await user.save();

            const lastLogin = await SecurityLog.findOne({ userId: user._id, event: "login_success" }).sort({ createdAt: -1 });
            if (lastLogin && (lastLogin.ipAddress !== ipAddress || lastLogin.deviceInfo !== deviceInfo)) {
                await SecurityLog.create({ userId: user._id, event: "suspicious_login", ipAddress, deviceInfo, details: `New login from unfamiliar IP/device.` });
            }

            await Session.deleteMany({ userId: user._id });

            const token = generateToken({ userId: user._id.toString(), email: user.email, role: user.role });
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            
            await Session.create({
                userId: user._id,
                tokenHash,
                ipAddress,
                deviceInfo,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });

            await SecurityLog.create({ userId: user._id, event: "login_success", ipAddress, deviceInfo });

            res.json({
                message: "Login successful",
                token,
                user: { id: user._id, name: user.name, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified }
            });
            return;
        }

        if (action === "register") {
            if (!name || !email || !password) {
                res.status(400).json({ error: "Name, email, and password are required" });
                return;
            }

            const strength = validatePasswordStrength(password);
            if (!strength.isValid) {
                res.status(400).json({ error: strength.error });
                return;
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                res.status(409).json({ error: "User with this email already exists" });
                return;
            }

            const verificationToken = crypto.randomBytes(32).toString('hex');
            const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
            
            const user = new User({ 
                name, email, password,
                verificationToken: hashedVerificationToken,
                verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                passwordUpdatedAt: new Date(),
            });

            await user.save();
            if (user.password) {
                user.passwordHistory.push(String(user.password));
                await user.save();
            }

            console.log(`[EMAIL MOCK] Verification email sent to ${email}. Link: http://localhost:3000/verify-email?token=${verificationToken}&email=${email}`);

            const token = generateToken({ userId: user._id.toString(), email: user.email, role: user.role });
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            
            await Session.create({
                userId: user._id,
                tokenHash,
                ipAddress,
                deviceInfo,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });

            await SecurityLog.create({ userId: user._id, event: "login_success", ipAddress, deviceInfo, details: "Account registered" });

            res.status(201).json({
                message: "Registration successful. Please verify your email.",
                token,
                user: { id: user._id, name: user.name, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified }
            });
            return;
        }

        res.status(400).json({ error: "Invalid action" });
    } catch (error: any) {
        console.error("[Auth Route Error]:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/verify", async (req: Request, res: Response): Promise<void> => {
    try {
        const { token, email } = req.body;
        if (!token || !email) {
            res.status(400).json({ error: "Token and email are required" });
            return;
        }

        const user = await User.findOne({ email });
        if (!user || user.isEmailVerified || !user.verificationToken || !user.verificationExpires || user.verificationExpires < new Date()) {
            res.status(400).json({ error: "Invalid or expired token" });
            return;
        }

        const hashedProvidedToken = crypto.createHash('sha256').update(token).digest('hex');
        if (hashedProvidedToken !== user.verificationToken) {
            res.status(400).json({ error: "Invalid or expired token" });
            return;
        }

        user.isEmailVerified = true;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        await user.save();

        res.json({ message: "Email verified successfully" });
    } catch (error) {
        console.error("[Verify Email Route Error]:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/forgot-password", async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: "Email is required" });
            return;
        }

        const user = await User.findOne({ email });
        if (!user) {
            res.json({ message: "If that email exists, a password reset link has been sent." });
            return;
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); 
        await user.save();

        const { ipAddress, deviceInfo } = getClientInfo(req);
        await SecurityLog.create({ userId: user._id, event: "password_reset_requested", ipAddress, deviceInfo });

        console.log(`[EMAIL MOCK] Password Reset email sent to ${email}. Link: http://localhost:3000/reset-password?token=${resetToken}&email=${email}`);

        res.json({ message: "If that email exists, a password reset link has been sent." });
    } catch (error) {
        console.error("[Forgot Password Route Error]:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/reset-password", async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, token, newPassword } = req.body;
        if (!email || !token || !newPassword) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        const user = await User.findOne({ email });
        if (!user || !user.resetPasswordToken || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            res.status(400).json({ error: "Invalid token or email" });
            return;
        }

        const hashedProvidedToken = crypto.createHash('sha256').update(token).digest('hex');
        if (hashedProvidedToken !== user.resetPasswordToken) {
            res.status(400).json({ error: "Invalid or expired reset token" });
            return;
        }

        const strength = validatePasswordStrength(newPassword);
        if (!strength.isValid) {
            res.status(400).json({ error: strength.error });
            return;
        }

        const recentPasswords = user.passwordHistory.slice(-3);
        let isReused = false;
        for (const oldHash of recentPasswords) {
            if (await bcrypt.compare(newPassword, oldHash)) {
                isReused = true;
                break;
            }
        }

        if (isReused) {
            res.status(400).json({ error: "Cannot reuse any of your last 3 passwords." });
            return;
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.passwordUpdatedAt = new Date();
        await user.save();

        if (user.password) {
            user.passwordHistory.push(user.password);
            if (user.passwordHistory.length > 5) user.passwordHistory.shift();
            await user.save();
        }

        await Session.deleteMany({ userId: user._id });

        const { ipAddress, deviceInfo } = getClientInfo(req);
        await SecurityLog.create({ userId: user._id, event: "password_reset_completed", ipAddress, deviceInfo });

        res.json({ message: "Password reset successfully. All active sessions have been revoked." });
    } catch (error) {
        console.error("[Reset Password Route Error]:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/sessions", authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const sessions = await Session.find({ userId: user.userId }).sort({ lastActive: -1 });
        
        const currentToken = req.headers.authorization?.split(" ")[1] || "";
        const currentTokenHash = currentToken ? crypto.createHash('sha256').update(currentToken).digest('hex') : "";

        const formattedSessions = sessions.map(s => ({
            id: s._id,
            deviceInfo: s.deviceInfo,
            ipAddress: s.ipAddress,
            lastActive: s.lastActive,
            isCurrent: s.tokenHash === currentTokenHash
        }));

        res.json({ sessions: formattedSessions });
    } catch (error) {
        console.error("[Sessions GET Error]:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.delete("/sessions", authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const { sessionId } = req.body;
        if (!sessionId) {
            res.status(400).json({ error: "Session ID is required" });
            return;
        }

        const session = await Session.findOne({ _id: sessionId, userId: user.userId });
        if (!session) {
            res.status(404).json({ error: "Session not found" });
            return;
        }

        await session.deleteOne();
        res.json({ message: "Session revoked successfully" });
    } catch (error) {
        console.error("[Sessions DELETE Error]:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/security-logs", authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const logs = await SecurityLog.find({ userId: user.userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ logs });
    } catch (error) {
        console.error("[Security Logs Error]:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
