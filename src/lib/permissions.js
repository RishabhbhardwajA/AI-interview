"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissions = void 0;
exports.hasPermission = hasPermission;
exports.hasRole = hasRole;
exports.RolePermissions = {
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
function hasPermission(userRole, permission) {
    if (!userRole)
        return false;
    const permissions = exports.RolePermissions[userRole] || [];
    return permissions.includes(permission);
}
function hasRole(userRole, allowedRoles) {
    if (!userRole)
        return false;
    return allowedRoles.includes(userRole);
}
