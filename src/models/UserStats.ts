import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBadge {
    id: string;
    name: string;
    icon: string;
    description: string;
    unlockedAt: Date;
}

export interface IRankHistoryEntry {
    rank: string;
    date: Date;
    points: number;
}

export interface IUserStats extends Document {
    userId: mongoose.Types.ObjectId;
    totalPoints: number;
    currentRank: string;
    badges: IBadge[];
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date | null;
    challengesCompleted: number;
    challengesByCategory: {
        technical: number;
        hr: number;
        aptitude: number;
        domainSpecific: number;
    };
    rankHistory: IRankHistoryEntry[];
    weeklyPoints: number;
    monthlyPoints: number;
    weekStartDate: Date | null;
    monthStartDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const BadgeSchema = new Schema<IBadge>({
    id: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, required: true },
    description: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
});

const RankHistorySchema = new Schema<IRankHistoryEntry>({
    rank: { type: String, required: true },
    date: { type: Date, default: Date.now },
    points: { type: Number, required: true },
});

const UserStatsSchema: Schema<IUserStats> = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        totalPoints: { type: Number, default: 0 },
        currentRank: { type: String, default: "Bronze" },
        badges: [BadgeSchema],
        currentStreak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        lastActiveDate: { type: Date, default: null },
        challengesCompleted: { type: Number, default: 0 },
        challengesByCategory: {
            technical: { type: Number, default: 0 },
            hr: { type: Number, default: 0 },
            aptitude: { type: Number, default: 0 },
            domainSpecific: { type: Number, default: 0 },
        },
        rankHistory: [RankHistorySchema],
        weeklyPoints: { type: Number, default: 0 },
        monthlyPoints: { type: Number, default: 0 },
        weekStartDate: { type: Date, default: null },
        monthStartDate: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

UserStatsSchema.index({ totalPoints: -1 });
UserStatsSchema.index({ weeklyPoints: -1 });

// Rank calculation helper
export function calculateRank(points: number): string {
    if (points >= 1000) return "Diamond";
    if (points >= 600) return "Platinum";
    if (points >= 300) return "Gold";
    if (points >= 100) return "Silver";
    return "Bronze";
}

export function getRankIcon(rank: string): string {
    const icons: Record<string, string> = {
        Bronze: "🥉",
        Silver: "🥈",
        Gold: "🥇",
        Platinum: "💎",
        Diamond: "👑",
    };
    return icons[rank] || "🥉";
}

// Badge definitions
export const BADGE_DEFINITIONS = [
    { id: "first_blood", name: "First Blood", icon: "🔥", description: "Complete your first challenge" },
    { id: "speed_demon", name: "Speed Demon", icon: "⚡", description: "Complete a challenge in under 5 minutes" },
    { id: "perfect_score", name: "Perfect Score", icon: "🎯", description: "Score 10/10 on any question" },
    { id: "week_warrior", name: "Week Warrior", icon: "📅", description: "Maintain a 7-day streak" },
    { id: "monthly_master", name: "Monthly Master", icon: "🏆", description: "Maintain a 30-day streak" },
    { id: "tech_titan", name: "Technical Titan", icon: "🧠", description: "Complete 10 technical challenges" },
    { id: "hr_hero", name: "HR Hero", icon: "💬", description: "Complete 10 HR challenges" },
    { id: "aptitude_ace", name: "Aptitude Ace", icon: "🧮", description: "Complete 10 aptitude challenges" },
    { id: "all_rounder", name: "All-Rounder", icon: "⭐", description: "Complete challenges in all 4 categories" },
    { id: "top_3", name: "Top 3 Finish", icon: "👑", description: "Rank in top 3 on any challenge" },
];

const UserStats: Model<IUserStats> =
    mongoose.models.UserStats ||
    mongoose.model<IUserStats>("UserStats", UserStatsSchema);

export default UserStats;
