import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import SecurityLog from "@/models/SecurityLog";
import { getUserFromRequest, errorResponse, successResponse } from "@/middleware/auth";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const user = getUserFromRequest(req);
        if (!user) return errorResponse("Unauthorized", 401);

        const logs = await SecurityLog.find({ userId: user.userId })
            .sort({ createdAt: -1 })
            .limit(50); // Get last 50 events

        return successResponse({ logs });
    } catch (error) {
        console.error("[Security Logs API Error]:", error);
        return errorResponse("Internal server error", 500);
    }
}
