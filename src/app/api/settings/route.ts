import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import SecurityLog from "@/models/SecurityLog";
import Session from "@/models/Session";
import { getUserFromRequest, errorResponse, successResponse } from "@/middleware/auth";
import * as bcrypt from "bcryptjs";

function validatePasswordStrength(password: string): { isValid: boolean; error?: string } {
    if (password.length < 8) return { isValid: false, error: "Password must be at least 8 characters" };
    if (!/[A-Z]/.test(password)) return { isValid: false, error: "Password must contain an uppercase letter" };
    if (!/[a-z]/.test(password)) return { isValid: false, error: "Password must contain a lowercase letter" };
    if (!/[0-9]/.test(password)) return { isValid: false, error: "Password must contain a number" };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { isValid: false, error: "Password must contain a special character" };
    return { isValid: true };
}

function getClientInfo(req: NextRequest) {
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const deviceInfo = req.headers.get("user-agent") || "Unknown Device";
    return { ipAddress, deviceInfo };
}

// PUT /api/settings — Update profile or change password
export async function PUT(req: NextRequest) {
    try {
        await connectDB();

        const jwtUser = getUserFromRequest(req);
        if (!jwtUser) {
            return errorResponse("Unauthorized", 401);
        }

        const body = await req.json();
        const { action } = body;
        const { ipAddress, deviceInfo } = getClientInfo(req);

        // ============ CHANGE PASSWORD ============
        if (action === "change-password") {
            const { currentPassword, newPassword } = body;

            if (!currentPassword || !newPassword) {
                return errorResponse("Current password and new password are required", 400);
            }

            const user = await User.findById(jwtUser.userId);
            if (!user) return errorResponse("User not found", 404);

            // Verify current password
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                await SecurityLog.create({
                    userId: user._id,
                    event: "password_change_failed",
                    ipAddress,
                    deviceInfo,
                    details: "Incorrect current password provided",
                });
                return errorResponse("Current password is incorrect", 401);
            }

            // Validate new password strength
            const strength = validatePasswordStrength(newPassword);
            if (!strength.isValid) {
                return errorResponse(strength.error || "New password is too weak", 400);
            }

            // Prevent reuse of last 3 passwords
            if (user.passwordHistory && user.passwordHistory.length > 0) {
                for (const oldHash of user.passwordHistory.slice(-3)) {
                    const isReused = await bcrypt.compare(newPassword, oldHash);
                    if (isReused) {
                        return errorResponse("You cannot reuse any of your last 3 passwords", 400);
                    }
                }
            }

            // Update password
            user.password = newPassword;
            user.passwordUpdatedAt = new Date();
            await user.save();

            // Add to password history
            user.passwordHistory.push(user.password);
            if (user.passwordHistory.length > 5) {
                user.passwordHistory = user.passwordHistory.slice(-5);
            }
            await user.save();

            await SecurityLog.create({
                userId: user._id,
                event: "password_changed",
                ipAddress,
                deviceInfo,
            });

            return successResponse({ message: "Password changed successfully" });
        }

        // ============ UPDATE PROFILE ============
        if (action === "update-profile") {
            const { name, experienceLevel } = body;

            const user = await User.findById(jwtUser.userId);
            if (!user) return errorResponse("User not found", 404);

            if (name) {
                if (name.length < 2 || name.length > 50) {
                    return errorResponse("Name must be between 2 and 50 characters", 400);
                }
                user.name = name.trim();
            }

            if (experienceLevel) {
                const allowed = ["Fresher", "Internship Seeker", "Experienced"];
                if (!allowed.includes(experienceLevel)) {
                    return errorResponse("Invalid experience level", 400);
                }
                user.experienceLevel = experienceLevel;
            }

            await user.save();

            await SecurityLog.create({
                userId: user._id,
                event: "profile_updated",
                ipAddress,
                deviceInfo,
            });

            return successResponse({
                message: "Profile updated successfully",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    experienceLevel: user.experienceLevel,
                    isEmailVerified: user.isEmailVerified,
                },
            });
        }

        // ============ DELETE ACCOUNT ============
        if (action === "delete-account") {
            const { password } = body;
            if (!password) return errorResponse("Password is required to delete account", 400);

            const user = await User.findById(jwtUser.userId);
            if (!user) return errorResponse("User not found", 404);

            const isMatch = await user.comparePassword(password);
            if (!isMatch) return errorResponse("Password is incorrect", 401);

            // Delete all sessions
            await Session.deleteMany({ userId: user._id });
            // Delete all security logs
            await SecurityLog.deleteMany({ userId: user._id });
            // Delete user
            await User.findByIdAndDelete(user._id);

            return successResponse({ message: "Account deleted successfully" });
        }

        return errorResponse("Invalid action", 400);
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`[Settings API Error] ${error.name}: ${error.message}`);
            return errorResponse(error.message, 500);
        }
        return errorResponse("Internal server error", 500);
    }
}

// GET /api/settings — Get user profile
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const jwtUser = getUserFromRequest(req);
        if (!jwtUser) return errorResponse("Unauthorized", 401);

        const user = await User.findById(jwtUser.userId).select("-password -passwordHistory -verificationToken -resetPasswordToken");
        if (!user) return errorResponse("User not found", 404);

        return successResponse({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                experienceLevel: user.experienceLevel,
                isEmailVerified: user.isEmailVerified,
                passwordUpdatedAt: user.passwordUpdatedAt,
                createdAt: user.createdAt,
            },
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`[Settings API GET Error] ${error.name}: ${error.message}`);
        }
        return errorResponse("Internal server error", 500);
    }
}
