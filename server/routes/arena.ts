import { Router, Request, Response } from "express";
import Challenge from "../../src/models/Challenge";
import ChallengeAttempt from "../../src/models/ChallengeAttempt";
import UserStats, { calculateRank, getRankIcon, BADGE_DEFINITIONS } from "../../src/models/UserStats";
import User from "../../src/models/User";
import { authenticateToken } from "../middleware/auth";
import { evaluateChallengeAnswer, generateChallenge } from "../../src/lib/groq";

const router = Router();
router.use(authenticateToken);

// Helper: ensure active challenges exist, auto-generate if needed
async function ensureActiveChallenges() {
    const now = new Date();
    // Check for active daily challenge
    const activeDaily = await Challenge.findOne({ type: "daily", activeFrom: { $lte: now }, activeTo: { $gte: now } });
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
            title: generated.title, description: generated.description, category: randomCat,
            difficulty, type: "daily", questions: generated.questions, activeFrom: todayStart,
            activeTo: todayEnd, totalParticipants: 0,
        });
    }

    // Check for active weekly challenge
    const activeWeekly = await Challenge.findOne({ type: "weekly", activeFrom: { $lte: now }, activeTo: { $gte: now } });
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
            title: generated.title, description: generated.description, category: randomCat,
            difficulty, type: "weekly", questions: generated.questions, activeFrom: weekStart,
            activeTo: weekEnd, totalParticipants: 0,
        });
    }
}

// Helper: update streak
function updateStreak(stats: any) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (stats.lastActiveDate) {
        const lastActive = new Date(stats.lastActiveDate);
        const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
        const diffDays = Math.floor((today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) stats.currentStreak += 1;
        else if (diffDays > 1) stats.currentStreak = 1;
    } else {
        stats.currentStreak = 1;
    }
    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    stats.lastActiveDate = now;
}

// Helper: check and award badges
function checkBadges(stats: any, attemptData: { totalTimeTaken: number; hasPerf10: boolean; rank: number; category: string; }) {
    const existingIds = new Set(stats.badges.map((b: any) => b.id));
    const newBadges: any[] = [];
    for (const def of BADGE_DEFINITIONS) {
        if (existingIds.has(def.id)) continue;
        let earned = false;
        switch (def.id) {
            case "first_blood": earned = stats.challengesCompleted >= 1; break;
            case "speed_demon": earned = attemptData.totalTimeTaken > 0 && attemptData.totalTimeTaken < 300; break;
            case "perfect_score": earned = attemptData.hasPerf10; break;
            case "week_warrior": earned = stats.currentStreak >= 7; break;
            case "monthly_master": earned = stats.currentStreak >= 30; break;
            case "tech_titan": earned = stats.challengesByCategory.technical >= 10; break;
            case "hr_hero": earned = stats.challengesByCategory.hr >= 10; break;
            case "aptitude_ace": earned = stats.challengesByCategory.aptitude >= 10; break;
            case "all_rounder": earned = stats.challengesByCategory.technical >= 1 && stats.challengesByCategory.hr >= 1 && stats.challengesByCategory.aptitude >= 1 && stats.challengesByCategory.domainSpecific >= 1; break;
            case "top_3": earned = attemptData.rank >= 1 && attemptData.rank <= 3; break;
        }
        if (earned) {
            newBadges.push({ id: def.id, name: def.name, icon: def.icon, description: def.description, unlockedAt: new Date() });
        }
    }
    if (newBadges.length > 0) stats.badges.push(...newBadges);
    return newBadges;
}

// POST /api/arena
router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const { action, challengeId, questionIndex, answer, timeTaken = 0 } = req.body;

        if (action === "attempt") {
            if (!challengeId) { res.status(400).json({ error: "Challenge ID is required" }); return; }
            const challenge = await Challenge.findById(challengeId);
            if (!challenge) { res.status(404).json({ error: "Challenge not found" }); return; }
            const existing = await ChallengeAttempt.findOne({ userId: user.userId, challengeId });
            if (existing) {
                res.json({ message: "Resuming existing attempt", attempt: { id: existing._id, status: existing.status, currentQuestion: existing.answers.length, totalQuestions: challenge.questions.length, answers: existing.answers }, challenge: { id: challenge._id, title: challenge.title, category: challenge.category, difficulty: challenge.difficulty, questions: challenge.questions.map(q => q.question) } });
                return;
            }
            const attempt = await ChallengeAttempt.create({ userId: user.userId, challengeId, answers: [], maxScore: challenge.questions.length * 10 });
            await Challenge.findByIdAndUpdate(challengeId, { $inc: { totalParticipants: 1 } });
            res.status(201).json({ message: "Challenge started", attempt: { id: attempt._id, status: "in-progress", currentQuestion: 0, totalQuestions: challenge.questions.length }, challenge: { id: challenge._id, title: challenge.title, category: challenge.category, difficulty: challenge.difficulty, questions: challenge.questions.map(q => q.question) } });
            return;
        }

        if (action === "submit") {
            const attemptId = req.body.attemptId;
            if (!attemptId) { res.status(400).json({ error: "Attempt ID is required" }); return; }
            const attempt = await ChallengeAttempt.findById(attemptId);
            if (!attempt) { res.status(404).json({ error: "Attempt not found" }); return; }
            if (attempt.status === "completed") { res.status(400).json({ error: "Challenge already completed" }); return; }
            const challenge = await Challenge.findById(attempt.challengeId);
            if (!challenge) { res.status(404).json({ error: "Challenge not found" }); return; }
            const qIndex = questionIndex ?? attempt.answers.length;
            if (qIndex >= challenge.questions.length) { res.status(400).json({ error: "All questions already answered" }); return; }
            const currentQ = challenge.questions[qIndex];
            
            let evalResult;
            if (!answer || answer.trim().length < 5) {
                evalResult = { score: 1, feedback: "Answer too short. Provide more detail." };
            } else {
                evalResult = await evaluateChallengeAnswer(currentQ.question, answer, currentQ.expectedTopics, challenge.category);
            }
            
            attempt.answers.push({ question: currentQ.question, answer: answer || "(Skipped)", score: evalResult.score, feedback: evalResult.feedback, timeTaken });
            attempt.totalTimeTaken += timeTaken;
            const isComplete = attempt.answers.length >= challenge.questions.length;

            if (isComplete) {
                attempt.status = "completed";
                attempt.completedAt = new Date();
                attempt.totalScore = attempt.answers.reduce((sum: any, a: any) => sum + a.score, 0);
                attempt.percentage = Math.round((attempt.totalScore / attempt.maxScore) * 100);
                const betterAttempts = await ChallengeAttempt.countDocuments({ challengeId: attempt.challengeId, status: "completed", totalScore: { $gt: attempt.totalScore } });
                attempt.rank = betterAttempts + 1;
                await attempt.save();

                let stats = await UserStats.findOne({ userId: user.userId });
                if (!stats) stats = await UserStats.create({ userId: user.userId });

                const pointsEarned = attempt.totalScore;
                stats.totalPoints += pointsEarned;
                stats.challengesCompleted += 1;
                const catKey = challenge.category === "domain-specific" ? "domainSpecific" : challenge.category;
                if (catKey in stats.challengesByCategory) { (stats.challengesByCategory as any)[catKey] += 1; }
                
                const now = new Date();
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (!stats.weekStartDate || stats.weekStartDate < weekAgo) { stats.weeklyPoints = pointsEarned; stats.weekStartDate = now; }
                else { stats.weeklyPoints += pointsEarned; }
                
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                if (!stats.monthStartDate || stats.monthStartDate < monthAgo) { stats.monthlyPoints = pointsEarned; stats.monthStartDate = now; }
                else { stats.monthlyPoints += pointsEarned; }
                
                updateStreak(stats);
                const newRank = calculateRank(stats.totalPoints);
                if (newRank !== stats.currentRank) { stats.rankHistory.push({ rank: newRank, date: now, points: stats.totalPoints }); stats.currentRank = newRank; }
                
                const hasPerf10 = attempt.answers.some((a: any) => a.score >= 10);
                const newBadges = checkBadges(stats, { totalTimeTaken: attempt.totalTimeTaken, hasPerf10, rank: attempt.rank, category: challenge.category });
                await stats.save();

                res.json({ message: "Challenge completed!", completed: true, evaluation: { score: evalResult.score, feedback: evalResult.feedback }, result: { totalScore: attempt.totalScore, maxScore: attempt.maxScore, percentage: attempt.percentage, rank: attempt.rank, pointsEarned, newBadges: newBadges.map(b => ({ name: b.name, icon: b.icon })), currentRank: stats.currentRank, totalPoints: stats.totalPoints, streak: stats.currentStreak } });
                return;
            }
            await attempt.save();
            res.json({ message: "Answer submitted", completed: false, evaluation: { score: evalResult.score, feedback: evalResult.feedback }, progress: { answered: attempt.answers.length, total: challenge.questions.length, runningScore: attempt.answers.reduce((sum: any, a: any) => sum + a.score, 0) } });
            return;
        }

        res.status(400).json({ error: "Invalid action. Use 'attempt' or 'submit'." });
    } catch (error: any) {
        console.error(`[Arena API Error]:`, error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

// GET /api/arena
router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        await ensureActiveChallenges();
        const now = new Date();
        const category = req.query.category as string;
        const filter: any = { activeFrom: { $lte: now }, activeTo: { $gte: now } };
        if (category) filter.category = category;
        const challenges = await Challenge.find(filter).sort({ type: 1, createdAt: -1 }).lean();
        const challengeIds = challenges.map((c: any) => c._id);
        const attempts = await ChallengeAttempt.find({ userId: user.userId, challengeId: { $in: challengeIds } }).lean();
        const attemptMap = new Map(attempts.map((a: any) => [a.challengeId.toString(), a]));
        const enriched = challenges.map((c: any) => ({ ...c, userAttempt: attemptMap.get(c._id.toString()) || null }));
        const stats = await UserStats.findOne({ userId: user.userId }).lean();
        res.json({ challenges: enriched, userStats: stats });
    } catch (error: any) {
        console.error(`[Arena GET Error]:`, error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

// GET /api/arena/leaderboard
router.get("/leaderboard", async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        const challengeId = req.query.challengeId as string;
        const period = (req.query.period as string) || "all";
        if (challengeId) {
            const attempts = await ChallengeAttempt.find({ challengeId, status: "completed" }).sort({ totalScore: -1, totalTimeTaken: 1 }).limit(50).lean();
            const userIds = attempts.map((a: any) => a.userId);
            const users = await User.find({ _id: { $in: userIds } }).select("name email").lean();
            const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));
            const leaderboard = attempts.map((a: any, i) => {
                const u = userMap.get(a.userId.toString());
                return { rank: i + 1, userId: a.userId.toString(), name: u?.name || "Anonymous", totalScore: a.totalScore, percentage: a.percentage, timeTaken: a.totalTimeTaken, isCurrentUser: a.userId.toString() === user.userId };
            });
            res.json({ leaderboard, type: "challenge" });
            return;
        }
        let sortField = "totalPoints";
        if (period === "weekly") sortField = "weeklyPoints";
        if (period === "monthly") sortField = "monthlyPoints";
        const allStats = await UserStats.find().sort({ [sortField]: -1 }).limit(50).lean();
        const userIds = allStats.map((s: any) => s.userId);
        const users = await User.find({ _id: { $in: userIds } }).select("name email").lean();
        const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));
        const leaderboard = allStats.map((s: any, i) => {
            const u = userMap.get(s.userId.toString());
            return { rank: i + 1, userId: s.userId.toString(), name: u?.name || "Anonymous", points: period === "weekly" ? s.weeklyPoints : period === "monthly" ? s.monthlyPoints : s.totalPoints, currentRank: s.currentRank, rankIcon: getRankIcon(s.currentRank), badges: s.badges.length, streak: s.currentStreak, challengesCompleted: s.challengesCompleted, isCurrentUser: s.userId.toString() === user.userId };
        });
        const currentUserInList = leaderboard.find(l => l.isCurrentUser);
        let currentUserPosition = null;
        if (!currentUserInList) {
            const userStatsDoc = await UserStats.findOne({ userId: user.userId });
            if (userStatsDoc) {
                const pts = period === "weekly" ? userStatsDoc.weeklyPoints : period === "monthly" ? userStatsDoc.monthlyPoints : userStatsDoc.totalPoints;
                const above = await UserStats.countDocuments({ [sortField]: { $gt: pts } });
                const u = await User.findById(user.userId).select("name").lean();
                currentUserPosition = { rank: above + 1, userId: user.userId, name: u?.name || "You", points: pts, currentRank: userStatsDoc.currentRank, rankIcon: getRankIcon(userStatsDoc.currentRank), badges: userStatsDoc.badges.length, streak: userStatsDoc.currentStreak, challengesCompleted: userStatsDoc.challengesCompleted, isCurrentUser: true };
            }
        }
        res.json({ leaderboard, currentUserPosition, type: "global", period });
    } catch (error: any) {
        console.error(`[Leaderboard Error]:`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/arena/stats
router.get("/stats", async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user!;
        let stats = await UserStats.findOne({ userId: user.userId }).lean();
        if (!stats) {
            const created = await UserStats.create({ userId: user.userId });
            stats = created.toObject();
        }
        const recentAttempts = await ChallengeAttempt.find({ userId: user.userId, status: "completed" }).sort({ completedAt: -1 }).limit(10).populate("challengeId", "title category difficulty type").lean();
        const unlockedIds = new Set(stats.badges.map((b: any) => b.id));
        const allBadges = BADGE_DEFINITIONS.map(def => ({ ...def, unlocked: unlockedIds.has(def.id), unlockedAt: stats.badges.find((b: any) => b.id === def.id)?.unlockedAt || null }));
        res.json({ stats: { totalPoints: stats.totalPoints, currentRank: stats.currentRank, rankIcon: getRankIcon(stats.currentRank), currentStreak: stats.currentStreak, longestStreak: stats.longestStreak, challengesCompleted: stats.challengesCompleted, challengesByCategory: stats.challengesByCategory, weeklyPoints: stats.weeklyPoints, monthlyPoints: stats.monthlyPoints, rankHistory: stats.rankHistory }, badges: allBadges, recentAttempts });
    } catch (error: any) {
        console.error(`[Stats Error]:`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
