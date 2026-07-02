import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Session from "@/models/Session";
import SecurityLog from "@/models/SecurityLog";
import { generateToken, errorResponse, successResponse } from "@/middleware/auth";
import crypto from "crypto";

// Helper for password strength validation
function validatePasswordStrength(password: string): { isValid: boolean; error?: string } {
    if (password.length < 8) return { isValid: false, error: "Password must be at least 8 characters" };
    if (!/[A-Z]/.test(password)) return { isValid: false, error: "Password must contain an uppercase letter" };
    if (!/[a-z]/.test(password)) return { isValid: false, error: "Password must contain a lowercase letter" };
    if (!/[0-9]/.test(password)) return { isValid: false, error: "Password must contain a number" };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { isValid: false, error: "Password must contain a special character" };
    return { isValid: true };
}

// Helper to get client IP and device info
function getClientInfo(req: NextRequest) {
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const deviceInfo = req.headers.get("user-agent") || "Unknown Device";
    return { ipAddress, deviceInfo };
}

// POST /api/auth
export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { name, email, password, action } = await req.json();
        const { ipAddress, deviceInfo } = getClientInfo(req);

        if (action === "login") {
            // ================== LOGIN LOGIC ==================
            if (!email || !password) {
                return errorResponse("Email and password are required", 400);
            }

            const user = await User.findOne({ email });
            if (!user) {
                return errorResponse("Invalid email or password", 401);
            }

            // Check Account Lockout
            if (user.lockoutUntil && user.lockoutUntil > new Date()) {
                const waitMins = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
                return errorResponse(`Account is locked. Please try again in ${waitMins} minutes.`, 403);
            }

            // Validate Password
            const isMatch = await user.comparePassword(password);
            
            if (!isMatch) {
                user.failedLoginAttempts += 1;
                
                await SecurityLog.create({
                    userId: user._id,
                    event: "login_failed",
                    ipAddress,
                    deviceInfo,
                });

                if (user.failedLoginAttempts >= 5) {
                    user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lockout
                    await SecurityLog.create({
                        userId: user._id,
                        event: "account_locked",
                        ipAddress,
                        deviceInfo,
                        details: "Account locked after 5 failed attempts",
                    });
                    await user.save();
                    return errorResponse("Too many failed attempts. Account locked for 15 minutes.", 403);
                }
                
                await user.save();
                return errorResponse("Invalid email or password", 401);
            }

            // Successful Login: Reset lockout counters
            user.failedLoginAttempts = 0;
            user.lockoutUntil = undefined;
            await user.save();

            // Suspicious Activity Detection
            const lastLogin = await SecurityLog.findOne({ userId: user._id, event: "login_success" }).sort({ createdAt: -1 });
            if (lastLogin && (lastLogin.ipAddress !== ipAddress || lastLogin.deviceInfo !== deviceInfo)) {
                await SecurityLog.create({
                    userId: user._id,
                    event: "suspicious_login",
                    ipAddress,
                    deviceInfo,
                    details: `New login from unfamiliar IP or device. Previous: ${lastLogin.ipAddress} / ${lastLogin.deviceInfo}`,
                });
                console.log(`[ALERT] Suspicious login detected for user ${user.email}`);
            }

            // Prevent duplicate sessions across multiple devices
            // By revoking all previous active sessions
            const deletedSessions = await Session.deleteMany({ userId: user._id });
            if (deletedSessions.deletedCount > 0) {
                console.log(`[INFO] Revoked ${deletedSessions.deletedCount} older sessions for user ${user.email} (Duplicate session prevention)`);
            }

            // Generate Token
            const token = generateToken({
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
            });

            // Create new Session
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            
            await Session.create({
                userId: user._id,
                tokenHash,
                ipAddress,
                deviceInfo,
                expiresAt,
            });

            // Log Login Success
            await SecurityLog.create({
                userId: user._id,
                event: "login_success",
                ipAddress,
                deviceInfo,
            });

            return successResponse({
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                },
            });
        }

        // ================== REGISTER LOGIC ==================
        if (!name || !email || !password) {
            return errorResponse("Name, email, and password are required", 400);
        }

        // Password Strength Validation
        const strength = validatePasswordStrength(password);
        if (!strength.isValid) {
            return errorResponse(strength.error || "Password is too weak", 400);
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return errorResponse("User with this email already exists", 409);
        }

        // Email Verification Token Generation
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Add initial password to history to prevent immediate reuse later
        const user = new User({ 
            name, 
            email, 
            password,
            verificationToken: hashedVerificationToken,
            verificationExpires,
            passwordUpdatedAt: new Date(),
        });

        // The password history needs the hashed password.
        // We will save first, then push the hashed password to history
        await user.save();
        if (user.password) {
            user.passwordHistory.push(String(user.password));
            await user.save();
        }

        // Simulate sending verification email
        console.log(`[EMAIL MOCK] Verification email sent to ${email}. Link: http://localhost:3000/verify-email?token=${verificationToken}&email=${email}`);

        // Note: For strict enterprise auth, we might NOT return a token here until email is verified.
        // However, to keep UX smooth, we allow login but `isEmailVerified` is false.
        const token = generateToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        // Create Session
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        await Session.create({
            userId: user._id,
            tokenHash,
            ipAddress,
            deviceInfo,
            expiresAt,
        });

        await SecurityLog.create({
            userId: user._id,
            event: "login_success",
            ipAddress,
            deviceInfo,
            details: "Account registered",
        });

        return successResponse(
            {
                message: "Registration successful. Please verify your email.",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isEmailVerified: user.isEmailVerified,
                },
            },
            201
        );
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`[Auth API Error] ${error.name}: ${error.message}\nStack: ${error.stack}`);
            if (error.message.includes("validation")) {
                return errorResponse(error.message, 400);
            }
        } else {
            console.error("[Auth API Error] Unknown error:", error);
        }
        return errorResponse("Internal server error", 500);
    }
}
