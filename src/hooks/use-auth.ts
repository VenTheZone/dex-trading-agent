import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery((api as any).users.currentUser);
  const { signIn, signOut } = useAuthActions();

  // Always return ready state - no auth required
  return {
    isLoading: false,
    isAuthenticated: true, // Always authenticated
    user,
    signIn,
    signOut,
  };
}