import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChallengeAnswer {
    question: string;
    answer: string;
    score: number;
    feedback: string;
    timeTaken: number;
}

export interface IChallengeAttempt extends Document {
    userId: mongoose.Types.ObjectId;
    challengeId: mongoose.Types.ObjectId;
    answers: IChallengeAnswer[];
    totalScore: number;
    maxScore: number;
    percentage: number;
    completedAt: Date | null;
    totalTimeTaken: number;
    rank: number;
    status: "in-progress" | "completed";
    createdAt: Date;
    updatedAt: Date;
}

const ChallengeAnswerSchema = new Schema<IChallengeAnswer>({
    question: { type: String, required: true },
    answer: { type: String, default: "" },
    score: { type: Number, default: 0, min: 0, max: 10 },
    feedback: { type: String, default: "" },
    timeTaken: { type: Number, default: 0 },
});

const ChallengeAttemptSchema: Schema<IChallengeAttempt> = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        challengeId: {
            type: Schema.Types.ObjectId,
            ref: "Challenge",
            required: true,
        },
        answers: [ChallengeAnswerSchema],
        totalScore: { type: Number, default: 0 },
        maxScore: { type: Number, default: 50 },
        percentage: { type: Number, default: 0 },
        completedAt: { type: Date, default: null },
        totalTimeTaken: { type: Number, default: 0 },
        rank: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ["in-progress", "completed"],
            default: "in-progress",
        },
    },
    {
        timestamps: true,
    }
);

ChallengeAttemptSchema.index({ userId: 1, challengeId: 1 }, { unique: true });
ChallengeAttemptSchema.index({ challengeId: 1, totalScore: -1 });

const ChallengeAttempt: Model<IChallengeAttempt> =
    mongoose.models.ChallengeAttempt ||
    mongoose.model<IChallengeAttempt>("ChallengeAttempt", ChallengeAttemptSchema);

export default ChallengeAttempt;
