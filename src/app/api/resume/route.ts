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

        const body = await req.json();
        const resumeText = body.resumeText;

        const cleanText = resumeText.replace(/\s+/g, '');
        if (!cleanText || cleanText.length < 50) {
            return errorResponse(
                "The PDF appears to be empty, an image, or contains too little text (minimum 50 characters required).",
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
