"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Role, Permission, hasPermission } from "@/lib/permissions";

interface PermissionGuardProps {
    children: React.ReactNode;
    requiredPermission: Permission;
    fallback?: React.ReactNode;
}

export default function PermissionGuard({ children, requiredPermission, fallback = null }: PermissionGuardProps) {
    const { user, loading } = useAuth();

    if (loading || !user) return null;

    const authorized = hasPermission(user.role as Role, requiredPermission);

    if (!authorized) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
