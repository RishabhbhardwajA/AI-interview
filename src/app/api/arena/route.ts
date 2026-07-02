import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import Challenge from "@/models/Challenge";
import ChallengeAttempt from "@/models/ChallengeAttempt";
import UserStats, { calculateRank, BADGE_DEFINITIONS } from "@/models/UserStats";
import { getUserFromRequest, errorResponse, successResponse } from "@/middleware/auth";
import { evaluateChallengeAnswer, generateChallenge } from "@/lib/groq";

// Helper: ensure active challenges exist, auto-generate if needed
async function ensureActiveChallenges() {
    const now = new Date();

    // Check for active daily challenge
    const activeDaily = await Challenge.findOne({
        type: "daily",
        activeFrom: { $lte: now },
        activeTo: { $gte: now },
    });

    if (!activeDaily) {
        const categories = ["technical", "hr", "aptitude", "domain-specific"] as const;
        const randomCat = categories[Math.floor(Math.random() * categories.length)];
        const difficulty = Math.floor(Math.random() * 3) + 2; // 2-4

        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        const generated = await generateChallenge(randomCat, difficulty, "daily");

        await Challenge.create({
            title: generated.title,
            description: generated.description,
            category: randomCat,
            difficulty,
            type: "daily",
            questions: generated.questions,
            activeFrom: todayStart,
            activeTo: todayEnd,
            totalParticipants: 0,
        });
    }

    // Check for active weekly challenge
    const activeWeekly = await Challenge.findOne({
        type: "weekly",
        activeFrom: { $lte: now },
        activeTo: { $gte: now },
    });

    if (!activeWeekly) {
        const categories = ["technical", "hr", "aptitude", "domain-specific"] as const;
        const randomCat = categories[Math.floor(Math.random() * categories.length)];
        const difficulty = Math.floor(Math.random() * 2) + 3; // 3-4

        const weekStart = new Date(now);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        weekEnd.setHours(23, 59, 59, 999);

        const generated = await generateChallenge(randomCat, difficulty, "weekly");

        await Challenge.create({
            title: generated.title,
            description: generated.description,
            category: randomCat,
            difficulty,
            type: "weekly",
            questions: generated.questions,
            activeFrom: weekStart,
            activeTo: weekEnd,
            totalParticipants: 0,
        });
    }
}

// Helper: update streak
function updateStreak(stats: InstanceType<typeof UserStats>) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (stats.lastActiveDate) {
        const lastActive = new Date(stats.lastActiveDate);
        const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
        const diffDays = Math.floor((today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            stats.currentStreak += 1;
        } else if (diffDays > 1) {
            stats.currentStreak = 1;
        }
        // diffDays === 0 means already active today, don't change streak
    } else {
        stats.currentStreak = 1;
    }

    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    stats.lastActiveDate = now;
}

// Helper: check and award badges
function checkBadges(stats: InstanceType<typeof UserStats>, attemptData: {
    totalTimeTaken: number;
    hasPerf10: boolean;
    rank: number;
    category: string;
}) {
    const existingIds = new Set(stats.badges.map(b => b.id));
    const newBadges: typeof stats.badges = [];

    for (const def of BADGE_DEFINITIONS) {
        if (existingIds.has(def.id)) continue;

        let earned = false;
        switch (def.id) {
            case "first_blood":
                earned = stats.challengesCompleted >= 1;
                break;
            case "speed_demon":
                earned = attemptData.totalTimeTaken > 0 && attemptData.totalTimeTaken < 300;
                break;
            case "perfect_score":
                earned = attemptData.hasPerf10;
                break;
            case "week_warrior":
                earned = stats.currentStreak >= 7;
                break;
            case "monthly_master":
                earned = stats.currentStreak >= 30;
                break;
            case "tech_titan":
                earned = stats.challengesByCategory.technical >= 10;
                break;
            case "hr_hero":
                earned = stats.challengesByCategory.hr >= 10;
                break;
            case "aptitude_ace":
                earned = stats.challengesByCategory.aptitude >= 10;
                break;
            case "all_rounder":
                earned =
                    stats.challengesByCategory.technical >= 1 &&
                    stats.challengesByCategory.hr >= 1 &&
                    stats.challengesByCategory.aptitude >= 1 &&
                    stats.challengesByCategory.domainSpecific >= 1;
                break;
            case "top_3":
                earned = attemptData.rank >= 1 && attemptData.rank <= 3;
                break;
        }

        if (earned) {
            newBadges.push({
                id: def.id,
                name: def.name,
                icon: def.icon,
                description: def.description,
                unlockedAt: new Date(),
            });
        }
    }

    if (newBadges.length > 0) {
        stats.badges.push(...newBadges);
    }

    return newBadges;
}

// POST /api/arena
export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const user = getUserFromRequest(req);
        if (!user) return errorResponse("Unauthorized", 401);

        const body = await req.json();
        const { action } = body;

        // Start a challenge attempt
        if (action === "attempt") {
            const { challengeId } = body;
            if (!challengeId) return errorResponse("Challenge ID is required", 400);

            const challenge = await Challenge.findById(challengeId);
            if (!challenge) return errorResponse("Challenge not found", 404);

            // Check if already attempted
            const existing = await ChallengeAttempt.findOne({
                userId: user.userId,
                challengeId,
            });

            if (existing) {
                return successResponse({
                    message: "Resuming existing attempt",
                    attempt: {
                        id: existing._id,
                        status: existing.status,
                        currentQuestion: existing.answers.length,
                        totalQuestions: challenge.questions.length,
                        answers: existing.answers,
                    },
                    challenge: {
                        id: challenge._id,
                        title: challenge.title,
                        category: challenge.category,
                        difficulty: challenge.difficulty,
                        questions: challenge.questions.map(q => q.question),
                    },
                });
            }

            // Create new attempt
            const attempt = await ChallengeAttempt.create({
                userId: user.userId,
                challengeId,
                answers: [],
                maxScore: challenge.questions.length * 10,
            });

            // Increment participants
            await Challenge.findByIdAndUpdate(challengeId, { $inc: { totalParticipants: 1 } });

            return successResponse(
                {
                    message: "Challenge started",
                    attempt: {
                        id: attempt._id,
                        status: "in-progress",
                        currentQuestion: 0,
                        totalQuestions: challenge.questions.length,
                    },
                    challenge: {
                        id: challenge._id,
                        title: challenge.title,
                        category: challenge.category,
                        difficulty: challenge.difficulty,
                        questions: challenge.questions.map(q => q.question),
                    },
                },
                201
            );
        }

        // Submit an answer
        if (action === "submit") {
            const { attemptId, questionIndex, answer, timeTaken = 0 } = body;
            if (!attemptId) return errorResponse("Attempt ID is required", 400);

            const attempt = await ChallengeAttempt.findById(attemptId);
            if (!attempt) return errorResponse("Attempt not found", 404);
            if (attempt.status === "completed") return errorResponse("Challenge already completed", 400);

            const challenge = await Challenge.findById(attempt.challengeId);
            if (!challenge) return errorResponse("Challenge not found", 404);

            const qIndex = questionIndex ?? attempt.answers.length;
            if (qIndex >= challenge.questions.length) {
                return errorResponse("All questions already answered", 400);
            }

            const currentQ = challenge.questions[qIndex];

            // Evaluate answer
            let evalResult;
            if (!answer || answer.trim().length < 5) {
                evalResult = { score: 1, feedback: "Answer too short. Provide more detail." };
            } else {
                evalResult = await evaluateChallengeAnswer(
                    currentQ.question,
                    answer,
                    currentQ.expectedTopics,
                    challenge.category
                );
            }

            // Add answer to attempt
            attempt.answers.push({
                question: currentQ.question,
                answer: answer || "(Skipped)",
                score: evalResult.score,
                feedback: evalResult.feedback,
                timeTaken,
            });

            attempt.totalTimeTaken += timeTaken;

            // Check if all questions answered
            const isComplete = attempt.answers.length >= challenge.questions.length;

            if (isComplete) {
                attempt.status = "completed";
                attempt.completedAt = new Date();
                attempt.totalScore = attempt.answers.reduce((sum, a) => sum + a.score, 0);
                attempt.percentage = Math.round((attempt.totalScore / attempt.maxScore) * 100);

                // Calculate rank for this challenge
                const betterAttempts = await ChallengeAttempt.countDocuments({
                    challengeId: attempt.challengeId,
                    status: "completed",
                    totalScore: { $gt: attempt.totalScore },
                });
                attempt.rank = betterAttempts + 1;

                await attempt.save();

                // Update UserStats
                let stats = await UserStats.findOne({ userId: user.userId });
                if (!stats) {
                    stats = await UserStats.create({ userId: user.userId });
                }

                // Points: score-based (totalScore as points)
                const pointsEarned = attempt.totalScore;
                stats.totalPoints += pointsEarned;
                stats.challengesCompleted += 1;

                // Category tracking
                const catKey = challenge.category === "domain-specific" ? "domainSpecific" : challenge.category;
                if (catKey in stats.challengesByCategory) {
                    (stats.challengesByCategory as Record<string, number>)[catKey] += 1;
                }

                // Weekly/monthly points
                const now = new Date();
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (!stats.weekStartDate || stats.weekStartDate < weekAgo) {
                    stats.weeklyPoints = pointsEarned;
                    stats.weekStartDate = now;
                } else {
                    stats.weeklyPoints += pointsEarned;
                }

                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                if (!stats.monthStartDate || stats.monthStartDate < monthAgo) {
                    stats.monthlyPoints = pointsEarned;
                    stats.monthStartDate = now;
                } else {
                    stats.monthlyPoints += pointsEarned;
                }

                // Streak
                updateStreak(stats);

                // Rank
                const newRank = calculateRank(stats.totalPoints);
                if (newRank !== stats.currentRank) {
                    stats.rankHistory.push({ rank: newRank, date: now, points: stats.totalPoints });
                    stats.currentRank = newRank;
                }

                // Badges
                const hasPerf10 = attempt.answers.some(a => a.score >= 10);
                const newBadges = checkBadges(stats, {
                    totalTimeTaken: attempt.totalTimeTaken,
                    hasPerf10,
                    rank: attempt.rank,
                    category: challenge.category,
                });

                await stats.save();

                return successResponse({
                    message: "Challenge completed!",
                    completed: true,
                    evaluation: { score: evalResult.score, feedback: evalResult.feedback },
                    result: {
                        totalScore: attempt.totalScore,
                        maxScore: attempt.maxScore,
                        percentage: attempt.percentage,
                        rank: attempt.rank,
                        pointsEarned,
                        newBadges: newBadges.map(b => ({ name: b.name, icon: b.icon })),
                        currentRank: stats.currentRank,
                        totalPoints: stats.totalPoints,
                        streak: stats.currentStreak,
                    },
                });
            }

            await attempt.save();

            return successResponse({
                message: "Answer submitted",
                completed: false,
                evaluation: { score: evalResult.score, feedback: evalResult.feedback },
                progress: {
                    answered: attempt.answers.length,
                    total: challenge.questions.length,
                    runningScore: attempt.answers.reduce((sum, a) => sum + a.score, 0),
                },
            });
        }

        return errorResponse("Invalid action. Use 'attempt' or 'submit'.", 400);
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`[Arena API Error] ${error.name}: ${error.message}`);
            return errorResponse(error.message, 500);
        }
        return errorResponse("Internal server error", 500);
    }
}

// GET /api/arena — List active challenges
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const user = getUserFromRequest(req);
        if (!user) return errorResponse("Unauthorized", 401);

        // Auto-generate challenges if none active
        await ensureActiveChallenges();

        const now = new Date();
        const url = new URL(req.url);
        const category = url.searchParams.get("category");

        const filter: Record<string, unknown> = {
            activeFrom: { $lte: now },
            activeTo: { $gte: now },
        };
        if (category) filter.category = category;

        const challenges = await Challenge.find(filter).sort({ type: 1, createdAt: -1 }).lean();

        // Get user's attempts for these challenges
        const challengeIds = challenges.map(c => c._id);
        const attempts = await ChallengeAttempt.find({
            userId: user.userId,
            challengeId: { $in: challengeIds },
        }).lean();

        const attemptMap = new Map(attempts.map(a => [a.challengeId.toString(), a]));

        const enriched = challenges.map(c => ({
            ...c,
            userAttempt: attemptMap.get(c._id.toString()) || null,
        }));

        // Get user stats
        const stats = await UserStats.findOne({ userId: user.userId }).lean();

        return successResponse({ challenges: enriched, userStats: stats });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`[Arena GET Error] ${error.name}: ${error.message}`);
            return errorResponse(error.message, 500);
        }
        return errorResponse("Internal server error", 500);
    }
}
