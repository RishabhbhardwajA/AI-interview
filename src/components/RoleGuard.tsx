"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Role, hasRole } from "@/lib/permissions";
import { FiLock } from "react-icons/fi";
import Link from "next/link";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: Role[];
    fallback?: React.ReactNode;
}

export function UnauthorizedFallback() {
    return (
        <div style={{ minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <div className="warm-card fade-in" style={{ padding: "48px", textAlign: "center", maxWidth: "400px" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(229, 62, 62, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                    <FiLock size={32} color="#E53E3E" />
                </div>
                <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#2D1B0E", marginBottom: "8px" }}>Access Denied</h1>
                <p style={{ color: "#6B5544", marginBottom: "24px", lineHeight: 1.5 }}>
                    You don&apos;t have the required permissions to view this page. If you believe this is a mistake, contact an administrator.
                </p>
                <Link href="/dashboard" className="btn-primary" style={{ textDecoration: "none" }}>
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
}

export default function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
    const { user, isAuthenticated, loading } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                router.push("/login");
            } else if (user) {
                setIsAuthorized(hasRole(user.role as Role, allowedRoles));
            }
        }
    }, [user, isAuthenticated, loading, allowedRoles, router]);

    if (loading) {
        return <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}><div className="spinner" /></div>;
    }

    if (!isAuthenticated) return null; // Will redirect

    if (!isAuthorized) {
        return <>{fallback !== undefined ? fallback : <UnauthorizedFallback />}</>;
    }

    return <>{children}</>;
}
