import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import ChallengeAttempt from "@/models/ChallengeAttempt";
import UserStats, { getRankIcon } from "@/models/UserStats";
import User from "@/models/User";
import { getUserFromRequest, errorResponse, successResponse } from "@/middleware/auth";

// GET /api/arena/leaderboard
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const user = getUserFromRequest(req);
        if (!user) return errorResponse("Unauthorized", 401);

        const url = new URL(req.url);
        const challengeId = url.searchParams.get("challengeId");
        const period = url.searchParams.get("period") || "all"; // all, weekly, monthly

        if (challengeId) {
            // Per-challenge leaderboard
            const attempts = await ChallengeAttempt.find({
                challengeId,
                status: "completed",
            })
                .sort({ totalScore: -1, totalTimeTaken: 1 })
                .limit(50)
                .lean();

            const userIds = attempts.map(a => a.userId);
            const users = await User.find({ _id: { $in: userIds } })
                .select("name email")
                .lean();
            const userMap = new Map(users.map(u => [u._id.toString(), u]));

            const leaderboard = attempts.map((a, i) => {
                const u = userMap.get(a.userId.toString());
                return {
                    rank: i + 1,
                    userId: a.userId.toString(),
                    name: u?.name || "Anonymous",
                    totalScore: a.totalScore,
                    percentage: a.percentage,
                    timeTaken: a.totalTimeTaken,
                    isCurrentUser: a.userId.toString() === user.userId,
                };
            });

            return successResponse({ leaderboard, type: "challenge" });
        }

        // Global leaderboard
        let sortField = "totalPoints";
        if (period === "weekly") sortField = "weeklyPoints";
        if (period === "monthly") sortField = "monthlyPoints";

        const allStats = await UserStats.find()
            .sort({ [sortField]: -1 })
            .limit(50)
            .lean();

        const userIds = allStats.map(s => s.userId);
        const users = await User.find({ _id: { $in: userIds } })
            .select("name email")
            .lean();
        const userMap = new Map(users.map(u => [u._id.toString(), u]));

        const leaderboard = allStats.map((s, i) => {
            const u = userMap.get(s.userId.toString());
            return {
                rank: i + 1,
                userId: s.userId.toString(),
                name: u?.name || "Anonymous",
                points: period === "weekly" ? s.weeklyPoints : period === "monthly" ? s.monthlyPoints : s.totalPoints,
                currentRank: s.currentRank,
                rankIcon: getRankIcon(s.currentRank),
                badges: s.badges.length,
                streak: s.currentStreak,
                challengesCompleted: s.challengesCompleted,
                isCurrentUser: s.userId.toString() === user.userId,
            };
        });

        // Find current user's position if not in top 50
        const currentUserInList = leaderboard.find(l => l.isCurrentUser);
        let currentUserPosition = null;
        if (!currentUserInList) {
            const userStatsDoc = await UserStats.findOne({ userId: user.userId });
            if (userStatsDoc) {
                const pts = period === "weekly" ? userStatsDoc.weeklyPoints : period === "monthly" ? userStatsDoc.monthlyPoints : userStatsDoc.totalPoints;
                const above = await UserStats.countDocuments({
                    [sortField]: { $gt: pts },
                });
                const u = await User.findById(user.userId).select("name").lean();
                currentUserPosition = {
                    rank: above + 1,
                    userId: user.userId,
                    name: u?.name || "You",
                    points: pts,
                    currentRank: userStatsDoc.currentRank,
                    rankIcon: getRankIcon(userStatsDoc.currentRank),
                    badges: userStatsDoc.badges.length,
                    streak: userStatsDoc.currentStreak,
                    challengesCompleted: userStatsDoc.challengesCompleted,
                    isCurrentUser: true,
                };
            }
        }

        return successResponse({ leaderboard, currentUserPosition, type: "global", period });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`[Leaderboard Error] ${error.name}: ${error.message}`);
            return errorResponse(error.message, 500);
        }
        return errorResponse("Internal server error", 500);
    }
}
