"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const SecurityLogSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
});
// Keep logs for 90 days
SecurityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
SecurityLogSchema.index({ userId: 1, createdAt: -1 });
const SecurityLog = mongoose_1.default.models.SecurityLog || mongoose_1.default.model("SecurityLog", SecurityLogSchema);
exports.default = SecurityLog;
