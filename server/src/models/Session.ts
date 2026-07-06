import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISession extends Document {
    userId: mongoose.Types.ObjectId;
    tokenHash: string; // Storing hashed token for security
    deviceInfo: string;
    ipAddress: string;
    lastActive: Date;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SessionSchema: Schema<ISession> = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tokenHash: {
            type: String,
            required: true,
        },
        deviceInfo: {
            type: String,
            default: "Unknown Device",
        },
        ipAddress: {
            type: String,
            default: "Unknown IP",
        },
        lastActive: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-delete expired sessions (TTL index)
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1 });

const Session: Model<ISession> =
    mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);

export default Session;
