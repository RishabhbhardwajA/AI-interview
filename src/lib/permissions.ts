export type Role = "Student" | "Mentor" | "Administrator";

export type Permission = 
    | "ACCESS_INTERVIEWS"
    | "ACCESS_REPORTS"
    | "REVIEW_STUDENTS"
    | "MANAGE_USERS"
    | "MONITOR_ACTIVITY"
    | "MANAGE_SETTINGS";

export const RolePermissions: Record<Role, Permission[]> = {
    Student: [
        "ACCESS_INTERVIEWS", 
        "ACCESS_REPORTS"
    ],
    Mentor: [
        "ACCESS_INTERVIEWS", 
        "ACCESS_REPORTS", 
        "REVIEW_STUDENTS"
    ],
    Administrator: [
        "ACCESS_INTERVIEWS", 
        "ACCESS_REPORTS", 
        "REVIEW_STUDENTS", 
        "MANAGE_USERS", 
        "MONITOR_ACTIVITY", 
        "MANAGE_SETTINGS"
    ]
};

export function hasPermission(userRole: Role | undefined, permission: Permission): boolean {
    if (!userRole) return false;
    const permissions = RolePermissions[userRole] || [];
    return permissions.includes(permission);
}

export function hasRole(userRole: Role | undefined, allowedRoles: Role[]): boolean {
    if (!userRole) return false;
    return allowedRoles.includes(userRole);
}
