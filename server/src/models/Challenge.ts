import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChallengeQuestion {
    question: string;
    expectedTopics: string[];
}

export interface IChallenge extends Document {
    title: string;
    description: string;
    category: "technical" | "hr" | "aptitude" | "domain-specific";
    difficulty: number;
    type: "daily" | "weekly";
    questions: IChallengeQuestion[];
    activeFrom: Date;
    activeTo: Date;
    totalParticipants: number;
    createdAt: Date;
    updatedAt: Date;
}

const ChallengeQuestionSchema = new Schema<IChallengeQuestion>({
    question: { type: String, required: true },
    expectedTopics: [{ type: String }],
});

const ChallengeSchema: Schema<IChallenge> = new Schema(
    {
        title: {
            type: String,
            required: [true, "Challenge title is required"],
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            enum: ["technical", "hr", "aptitude", "domain-specific"],
            required: true,
        },
        difficulty: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        type: {
            type: String,
            enum: ["daily", "weekly"],
            required: true,
        },
        questions: [ChallengeQuestionSchema],
        activeFrom: { type: Date, required: true },
        activeTo: { type: Date, required: true },
        totalParticipants: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

ChallengeSchema.index({ type: 1, activeFrom: 1, activeTo: 1 });
ChallengeSchema.index({ category: 1 });

const Challenge: Model<IChallenge> =
    mongoose.models.Challenge ||
    mongoose.model<IChallenge>("Challenge", ChallengeSchema);

export default Challenge;
