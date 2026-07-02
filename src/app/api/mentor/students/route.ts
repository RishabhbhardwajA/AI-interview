import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { requireRole, successResponse, errorResponse } from "@/middleware/auth";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        
        // RBAC Enforcement: Mentors and Administrators can access this API
        const authResult = requireRole(req, ["Mentor", "Administrator"]);
        if (!authResult.authorized) {
            return authResult.error as Response;
        }

        // Return users who have role "Student"
        const students = await User.find({ role: "Student" }, { name: 1, experienceLevel: 1, createdAt: 1 });
        
        return successResponse({ students });
    } catch (error) {
        console.error("[Mentor Students API Error]:", error);
        return errorResponse("Internal server error", 500);
    }
}
