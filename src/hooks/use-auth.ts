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