import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";

import { useEffect, useState } from "react";

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery((api as any).users.currentUser);
  const { signIn, signOut } = useAuthActions();

  const [isLoading, setIsLoading] = useState(true);

  // Debug logging
  console.log('[useAuth] Hook state:', {
    isAuthLoading,
    isAuthenticated,
    hasUser: !!user,
    isLoading,
    timestamp: new Date().toISOString()
  });

  // This effect updates the loading state once auth is loaded
  // For guest auth, we don't need to wait for user data
  useEffect(() => {
    console.log('[useAuth] useEffect triggered:', {
      isAuthLoading,
      isAuthenticated,
      userDefined: user !== undefined,
      willSetLoadingFalse: !isAuthLoading
    });
    
    // Set loading to false once Convex auth is ready
    // Don't wait for user query since guest users might not have a user record yet
    if (!isAuthLoading) {
      console.log('[useAuth] Setting isLoading to false - auth ready');
      setIsLoading(false);
    }
  }, [isAuthLoading, isAuthenticated, user]);

  return {
    isLoading,
    isAuthenticated,
    user,
    signIn,
    signOut,
  };
}