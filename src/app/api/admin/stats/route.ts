import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Interview from "@/models/Interview";
import { requireRole, successResponse, errorResponse } from "@/middleware/auth";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        
        // RBAC Enforcement: Only Administrators can access this API
        const authResult = requireRole(req, ["Administrator"]);
        if (!authResult.authorized) {
            return authResult.error as Response;
        }

        const totalUsers = await User.countDocuments();
        const activeInterviews = await Interview.countDocuments({ status: "in-progress" });
        const completedInterviews = await Interview.countDocuments({ status: "completed" });
        
        return successResponse({ 
            stats: {
                users: totalUsers,
                activeInterviews: activeInterviews,
                completedInterviews: completedInterviews,
                systemStatus: "Online"
            }
        });
    } catch (error) {
        console.error("[Admin Stats API Error]:", error);
        return errorResponse("Internal server error", 500);
    }
}
