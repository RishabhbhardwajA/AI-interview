import * as jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}

export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

export function getTokenFromRequest(req: NextRequest): string | null {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.substring(7);
    }
    return null;
}

export function getUserFromRequest(req: NextRequest): JWTPayload | null {
    const token = getTokenFromRequest(req);
    if (!token) return null;
    return verifyToken(token);
}

export function errorResponse(message: string, status: number = 400) {
    return Response.json({ error: message }, { status });
}

export function successResponse(data: Record<string, unknown>, status: number = 200) {
    return Response.json(data, { status });
}

import { Role, Permission, hasRole, hasPermission } from "@/lib/permissions";

export function requireRole(req: NextRequest, allowedRoles: Role[]) {
    const user = getUserFromRequest(req);
    if (!user) return { authorized: false, error: errorResponse("Unauthorized", 401), user: null };
    
    if (!hasRole(user.role as Role, allowedRoles)) {
        return { authorized: false, error: errorResponse("Forbidden: Insufficient role", 403), user };
    }
    
    return { authorized: true, error: null, user };
}

export function requirePermission(req: NextRequest, permission: Permission) {
    const user = getUserFromRequest(req);
    if (!user) return { authorized: false, error: errorResponse("Unauthorized", 401), user: null };
    
    if (!hasPermission(user.role as Role, permission)) {
        return { authorized: false, error: errorResponse("Forbidden: Insufficient permissions", 403), user };
    }
    
    return { authorized: true, error: null, user };
}
