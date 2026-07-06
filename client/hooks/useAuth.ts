import { useAuth as useAuthOriginal } from "@/context/AuthContext";

export function useAuth() {
    return useAuthOriginal();
}