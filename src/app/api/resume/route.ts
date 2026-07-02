import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import { getUserFromRequest, errorResponse, successResponse } from "@/middleware/auth";
import { analyzeResume } from "@/lib/groq";
import pdfParse from "pdf-parse";

// POST /api/resume — Analyze resume
export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const user = getUserFromRequest(req);
        if (!user) {
            return errorResponse("Unauthorized", 401);
        }

        const contentType = req.headers.get("content-type") || "";
        let resumeText = "";

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const file = formData.get("file") as File | null;
            const textData = formData.get("resumeText") as string | null;

            if (file) {
                if (file.type !== "application/pdf") {
                    return errorResponse("Only PDF files are supported", 400);
                }
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const pdfData = await pdfParse(buffer);
                resumeText = pdfData.text;
            } else if (textData) {
                resumeText = textData;
            }
        } else {
            const body = await req.json();
            resumeText = body.resumeText;
        }

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
