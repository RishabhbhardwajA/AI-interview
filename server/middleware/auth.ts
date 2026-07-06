import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { Role, Permission, hasRole, hasPermission } from "../../src/lib/permissions";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}

// Extend Express Request object to include user
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
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

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    console.log("[Auth Middleware] Auth Header received:", authHeader);
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        res.status(401).json({ error: "Unauthorized: No token provided" });
        return;
    }

    const payload = verifyToken(token);
    if (!payload) {
        res.status(401).json({ error: "Unauthorized: Invalid token" });
        return;
    }

    req.user = payload;
    next();
};

export const requireRole = (allowedRoles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        if (!hasRole(req.user.role as Role, allowedRoles)) {
            res.status(403).json({ error: "Forbidden: Insufficient role" });
            return;
        }

        next();
    };
};

export const requirePermission = (permission: Permission) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        if (!hasPermission(req.user.role as Role, permission)) {
            res.status(403).json({ error: "Forbidden: Insufficient permissions" });
            return;
        }

        next();
    };
};
