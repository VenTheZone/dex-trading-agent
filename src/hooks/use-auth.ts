import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";

export function useAuth() {
  // No auth needed for local/private use
  // Always return ready state
  return {
    isLoading: false,
    isAuthenticated: true,
    user: { id: 1, name: "Local User" }, // Hardcoded local user
    signIn: async () => {},
    signOut: async () => {},
  };
}