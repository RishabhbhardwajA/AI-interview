import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import UserStats, { getRankIcon, BADGE_DEFINITIONS } from "@/models/UserStats";
import ChallengeAttempt from "@/models/ChallengeAttempt";
import { getUserFromRequest, errorResponse, successResponse } from "@/middleware/auth";

// GET /api/arena/stats — Current user's stats
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const user = getUserFromRequest(req);
        if (!user) return errorResponse("Unauthorized", 401);

        let stats = await UserStats.findOne({ userId: user.userId }).lean();

        if (!stats) {
            // Create default stats
            const created = await UserStats.create({ userId: user.userId });
            stats = created.toObject();
        }

        // Get recent attempts
        const recentAttempts = await ChallengeAttempt.find({
            userId: user.userId,
            status: "completed",
        })
            .sort({ completedAt: -1 })
            .limit(10)
            .populate("challengeId", "title category difficulty type")
            .lean();

        // All badge definitions with unlocked status
        const unlockedIds = new Set(stats.badges.map(b => b.id));
        const allBadges = BADGE_DEFINITIONS.map(def => ({
            ...def,
            unlocked: unlockedIds.has(def.id),
            unlockedAt: stats.badges.find(b => b.id === def.id)?.unlockedAt || null,
        }));

        return successResponse({
            stats: {
                totalPoints: stats.totalPoints,
                currentRank: stats.currentRank,
                rankIcon: getRankIcon(stats.currentRank),
                currentStreak: stats.currentStreak,
                longestStreak: stats.longestStreak,
                challengesCompleted: stats.challengesCompleted,
                challengesByCategory: stats.challengesByCategory,
                weeklyPoints: stats.weeklyPoints,
                monthlyPoints: stats.monthlyPoints,
                rankHistory: stats.rankHistory,
            },
            badges: allBadges,
            recentAttempts,
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`[Stats Error] ${error.name}: ${error.message}`);
            return errorResponse(error.message, 500);
        }
        return errorResponse("Internal server error", 500);
    }
}
