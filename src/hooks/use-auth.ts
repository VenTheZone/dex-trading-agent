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

  // This effect updates the loading state once auth is loaded and user data is available
  // It ensures we only show content when both authentication state and user data are ready
  useEffect(() => {
    console.log('[useAuth] useEffect triggered:', {
      isAuthLoading,
      userDefined: user !== undefined,
      willSetLoadingFalse: !isAuthLoading && user !== undefined
    });
    
    if (!isAuthLoading && user !== undefined) {
      console.log('[useAuth] Setting isLoading to false');
      setIsLoading(false);
    }
  }, [isAuthLoading, user]);

  return {
    isLoading,
    isAuthenticated,
    user,
    signIn,
    signOut,
  };
}