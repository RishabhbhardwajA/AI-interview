import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import SecurityLog from "@/models/SecurityLog";
import { errorResponse, successResponse } from "@/middleware/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email } = await req.json();

        if (!email) {
            return errorResponse("Email is required", 400);
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Return success anyway to prevent email enumeration
            return successResponse({ message: "If that email exists, a password reset link has been sent." });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        // Token valid for 15 minutes
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); 
        await user.save();

        const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
        const deviceInfo = req.headers.get("user-agent") || "Unknown Device";

        await SecurityLog.create({
            userId: user._id,
            event: "password_reset_requested",
            ipAddress,
            deviceInfo,
        });

        // Mock sending email
        console.log(`[EMAIL MOCK] Password Reset email sent to ${email}. Link: http://localhost:3000/reset-password?token=${resetToken}&email=${email}`);

        return successResponse({ message: "If that email exists, a password reset link has been sent." });
    } catch (error) {
        console.error("[Forgot Password API Error]:", error);
        return errorResponse("Internal server error", 500);
    }
}
