import mongoose, { Schema, Document, Model } from "mongoose";

export type SecurityEventType = 
    | "login_success" 
    | "login_failed" 
    | "password_reset_requested"
    | "password_reset_completed"
    | "suspicious_login" 
    | "account_locked"
    | "password_changed"
    | "password_change_failed"
    | "profile_updated"
    | "session_revoked";

export interface ISecurityLog extends Document {
    userId: mongoose.Types.ObjectId;
    event: SecurityEventType;
    deviceInfo: string;
    ipAddress: string;
    details?: string;
    createdAt: Date;
}

const SecurityLogSchema: Schema<ISecurityLog> = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        event: {
            type: String,
            required: true,
            enum: [
                "login_success", 
                "login_failed", 
                "password_reset_requested",
                "password_reset_completed",
                "suspicious_login", 
                "account_locked",
                "password_changed",
                "password_change_failed",
                "profile_updated",
                "session_revoked"
            ],
        },
        deviceInfo: {
            type: String,
            default: "Unknown Device",
        },
        ipAddress: {
            type: String,
            default: "Unknown IP",
        },
        details: {
            type: String,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }
);

// Keep logs for 90 days
SecurityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
SecurityLogSchema.index({ userId: 1, createdAt: -1 });

const SecurityLog: Model<ISecurityLog> =
    mongoose.models.SecurityLog || mongoose.model<ISecurityLog>("SecurityLog", SecurityLogSchema);

export default SecurityLog;
