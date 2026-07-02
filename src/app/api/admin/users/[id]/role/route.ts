import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { requireRole, successResponse, errorResponse } from "@/middleware/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await connectDB();
        
        // RBAC Enforcement: Only Administrators can access this API
        const authResult = requireRole(req, ["Administrator"]);
        if (!authResult.authorized) {
            return authResult.error as Response;
        }

        const { role } = await req.json();
        
        const validRoles = ["Student", "Mentor", "Administrator"];
        if (!role || !validRoles.includes(role)) {
            return errorResponse("Invalid role provided", 400);
        }

        // Prevent admin from removing their own admin role to avoid lockouts
        if (id === authResult.user?.userId && role !== "Administrator") {
            return errorResponse("Cannot revoke your own Administrator privileges", 403);
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select("name email role");

        if (!user) {
            return errorResponse("User not found", 404);
        }
        
        return successResponse({ message: `Role updated to ${role}`, user });
    } catch (error) {
        console.error("[Admin Update Role API Error]:", error);
        return errorResponse("Internal server error", 500);
    }
}
