import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import Interview from "@/models/Interview";
import { requireRole, successResponse, errorResponse } from "@/middleware/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await connectDB();
        
        // RBAC Enforcement: Mentors and Administrators can access this API
        const authResult = requireRole(req, ["Mentor", "Administrator"]);
        if (!authResult.authorized) {
            return authResult.error as Response;
        }

        const { feedback } = await req.json();

        if (!feedback || typeof feedback !== "string") {
            return errorResponse("Feedback is required", 400);
        }

        const interview = await Interview.findByIdAndUpdate(
            id,
            {
                mentorFeedback: feedback,
                reviewedBy: authResult.user?.userId,
            },
            { new: true }
        ).populate("reviewedBy", "name");

        if (!interview) {
            return errorResponse("Interview not found", 404);
        }
        
        return successResponse({ message: "Feedback submitted successfully", interview });
    } catch (error) {
        console.error("[Mentor Feedback API Error]:", error);
        return errorResponse("Internal server error", 500);
    }
}
