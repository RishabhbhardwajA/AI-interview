import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import Session from "@/models/Session";
import { getUserFromRequest, errorResponse, successResponse, getTokenFromRequest } from "@/middleware/auth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const user = getUserFromRequest(req);
        if (!user) return errorResponse("Unauthorized", 401);

        const sessions = await Session.find({ userId: user.userId }).sort({ lastActive: -1 });
        
        // Let's identify the current session
        const currentToken = getTokenFromRequest(req);
        let currentTokenHash = "";
        if (currentToken) {
            currentTokenHash = crypto.createHash('sha256').update(currentToken).digest('hex');
        }

        const formattedSessions = sessions.map(s => ({
            id: s._id,
            deviceInfo: s.deviceInfo,
            ipAddress: s.ipAddress,
            lastActive: s.lastActive,
            isCurrent: s.tokenHash === currentTokenHash
        }));

        return successResponse({ sessions: formattedSessions });
    } catch (error) {
        console.error("[Sessions API Error]:", error);
        return errorResponse("Internal server error", 500);
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const user = getUserFromRequest(req);
        if (!user) return errorResponse("Unauthorized", 401);

        const { sessionId } = await req.json();
        if (!sessionId) return errorResponse("Session ID is required", 400);

        const session = await Session.findOne({ _id: sessionId, userId: user.userId });
        if (!session) return errorResponse("Session not found", 404);

        await session.deleteOne();

        return successResponse({ message: "Session revoked successfully" });
    } catch (error) {
        console.error("[Sessions API Error]:", error);
        return errorResponse("Internal server error", 500);
    }
}
