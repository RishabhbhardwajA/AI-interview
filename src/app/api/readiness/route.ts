import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Interview from "@/models/Interview";
import { getUserFromRequest, errorResponse, successResponse } from "@/middleware/auth";
import { evaluatePlacementReadiness } from "@/lib/groq";

// GET /api/readiness - get history
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const authUser = getUserFromRequest(req);
        if (!authUser) return errorResponse("Unauthorized", 401);

        const user = await User.findById(authUser.userId).select("experienceLevel readinessHistory");
        if (!user) return errorResponse("User not found", 404);

        return successResponse({
            experienceLevel: user.experienceLevel,
            readinessHistory: user.readinessHistory || []
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`[Readiness API Error] ${error.name}: ${error.message}\nStack: ${error.stack}`);
            return errorResponse(error.message, 500);
        }
        return errorResponse("Internal server error", 500);
    }
}

// POST /api/readiness - generate new assessment
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const authUser = getUserFromRequest(req);
        if (!authUser) return errorResponse("Unauthorized", 401);

        const user = await User.findById(authUser.userId);
        if (!user) return errorResponse("User not found", 404);

        const body = await req.json();
        if (body.experienceLevel) {
            user.experienceLevel = body.experienceLevel;
            await user.save();
        }

        // Fetch user interviews for data
        const interviews = await Interview.find({ userId: authUser.userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("topic score averageScore peakDifficulty status")
            .lean();

        const interviewStr = interviews.map(i =>
            `Topic: ${i.topic} | Avg Score: ${i.averageScore}/10 | Peak Difficulty: ${i.peakDifficulty}/5 | Status: ${i.status}`
        ).join("\n");

        // We would ideally fetch the latest resume analysis if we stored it on the user model,
        // but for now we accept resumeText in the POST body or use a default string.
        const resumeAnalysisStr = body.resumeAnalysisText || "No resume analysis provided for this candidate.";

        const evaluation = await evaluatePlacementReadiness(user.experienceLevel, resumeAnalysisStr, interviewStr);

        // Save into history
        user.readinessHistory.push({
            score: evaluation.score,
            category: evaluation.category,
            roadmap: evaluation.roadmap,
            weakAreas: evaluation.weakAreas,
            missingSkills: evaluation.missingSkills,
            createdAt: new Date(),
        });

        await user.save();

        return successResponse({
            message: "Placement readiness evaluated",
            evaluation,
            experienceLevel: user.experienceLevel,
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`[Readiness API Error] ${error.name}: ${error.message}\nStack: ${error.stack}`);
            return errorResponse(error.message, 500);
        }
        return errorResponse("Internal server error", 500);
    }
}
