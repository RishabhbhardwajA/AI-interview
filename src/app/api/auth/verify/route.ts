import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { errorResponse, successResponse } from "@/middleware/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { token, email } = await req.json();

        if (!token || !email) {
            return errorResponse("Token and email are required", 400);
        }

        const user = await User.findOne({ email });
        if (!user) {
            return errorResponse("Invalid or expired token", 400);
        }

        if (user.isEmailVerified) {
            return errorResponse("Email is already verified", 400);
        }

        if (!user.verificationToken || !user.verificationExpires || user.verificationExpires < new Date()) {
            return errorResponse("Invalid or expired token", 400);
        }

        // Hash the provided token and compare with stored hash
        const hashedProvidedToken = crypto.createHash('sha256').update(token).digest('hex');

        if (hashedProvidedToken !== user.verificationToken) {
            return errorResponse("Invalid or expired token", 400);
        }

        // Verify user
        user.isEmailVerified = true;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        await user.save();

        return successResponse({ message: "Email verified successfully" });
    } catch (error) {
        console.error("[Verify Email API Error]:", error);
        return errorResponse("Internal server error", 500);
    }
}
