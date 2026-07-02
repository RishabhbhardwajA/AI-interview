import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import Interview from "@/models/Interview";
import { requireRole, successResponse, errorResponse } from "@/middleware/auth";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        
        // RBAC Enforcement: Mentors and Administrators can access this API
        const authResult = requireRole(req, ["Mentor", "Administrator"]);
        if (!authResult.authorized) {
            return authResult.error as Response;
        }

        // Fetch completed interviews and populate student details
        const interviews = await Interview.find({ status: "completed" })
            .populate("userId", "name email")
            .populate("reviewedBy", "name")
            .sort({ updatedAt: -1 })
            .limit(50); // Get latest 50 for performance
        
        return successResponse({ interviews });
    } catch (error) {
        console.error("[Mentor Interviews API Error]:", error);
        return errorResponse("Internal server error", 500);
    }
}
