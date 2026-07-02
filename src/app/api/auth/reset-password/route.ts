import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Session from "@/models/Session";
import SecurityLog from "@/models/SecurityLog";
import { errorResponse, successResponse } from "@/middleware/auth";
import crypto from "crypto";
import * as bcrypt from "bcryptjs";

// Helper for password strength validation
function validatePasswordStrength(password: string): { isValid: boolean; error?: string } {
    if (password.length < 8) return { isValid: false, error: "Password must be at least 8 characters" };
    if (!/[A-Z]/.test(password)) return { isValid: false, error: "Password must contain an uppercase letter" };
    if (!/[a-z]/.test(password)) return { isValid: false, error: "Password must contain a lowercase letter" };
    if (!/[0-9]/.test(password)) return { isValid: false, error: "Password must contain a number" };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { isValid: false, error: "Password must contain a special character" };
    return { isValid: true };
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email, token, newPassword } = await req.json();

        if (!email || !token || !newPassword) {
            return errorResponse("Missing required fields", 400);
        }

        const user = await User.findOne({ email });
        if (!user) {
            return errorResponse("Invalid token or email", 400);
        }

        if (!user.resetPasswordToken || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            return errorResponse("Invalid or expired reset token", 400);
        }

        const hashedProvidedToken = crypto.createHash('sha256').update(token).digest('hex');
        if (hashedProvidedToken !== user.resetPasswordToken) {
            return errorResponse("Invalid or expired reset token", 400);
        }

        // Validate password strength
        const strength = validatePasswordStrength(newPassword);
        if (!strength.isValid) {
            return errorResponse(strength.error || "Weak password", 400);
        }

        // Check password history (prevent reusing last 3 passwords)
        const historyLimit = 3;
        const recentPasswords = user.passwordHistory.slice(-historyLimit);
        
        let isReused = false;
        for (const oldHash of recentPasswords) {
            if (await bcrypt.compare(newPassword, oldHash)) {
                isReused = true;
                break;
            }
        }

        if (isReused) {
            return errorResponse("Cannot reuse any of your last 3 passwords.", 400);
        }

        // Update password (pre-save hook will hash it)
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.passwordUpdatedAt = new Date();

        await user.save(); // This hashes the password via the hook

        // Push new hashed password to history
        if (user.password) {
            user.passwordHistory.push(user.password);
            if (user.passwordHistory.length > 5) {
                user.passwordHistory.shift(); // Keep only last 5 hashes
            }
            await user.save();
        }

        // Security: Revoke all active sessions
        await Session.deleteMany({ userId: user._id });

        const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
        const deviceInfo = req.headers.get("user-agent") || "Unknown Device";

        await SecurityLog.create({
            userId: user._id,
            event: "password_reset_completed",
            ipAddress,
            deviceInfo,
        });

        return successResponse({ message: "Password reset successfully. All active sessions have been revoked." });
    } catch (error) {
        console.error("[Reset Password API Error]:", error);
        return errorResponse("Internal server error", 500);
    }
}
