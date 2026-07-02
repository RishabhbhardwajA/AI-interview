import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import { getUserFromRequest, errorResponse, successResponse } from "@/middleware/auth";
import { analyzeResume } from "@/lib/groq";

// POST /api/resume — Analyze resume
export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const user = getUserFromRequest(req);
        if (!user) {
            return errorResponse("Unauthorized", 401);
        }

        const { resumeText } = await req.json();

        if (!resumeText || resumeText.trim().length < 50) {
            return errorResponse(
                "Please provide your resume text (minimum 50 characters)",
                400
            );
        }

        const analysis = await analyzeResume(resumeText);

        return successResponse({
            message: "Resume analyzed successfully",
            analysis,
        });
    } catch (error) {
        console.error("Resume API error:", error);
        return errorResponse("Internal server error", 500);
    }
}
