import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { requireRole, successResponse, errorResponse } from "@/middleware/auth";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        
        // RBAC Enforcement: Only Administrators can access this API
        const authResult = requireRole(req, ["Administrator"]);
        if (!authResult.authorized) {
            return authResult.error as Response;
        }

        const users = await User.find({}, { name: 1, email: 1, role: 1, createdAt: 1 }).sort({ createdAt: -1 });
        
        return successResponse({ users, count: users.length });
    } catch (error) {
        console.error("[Admin Users API Error]:", error);
        return errorResponse("Internal server error", 500);
    }
}
