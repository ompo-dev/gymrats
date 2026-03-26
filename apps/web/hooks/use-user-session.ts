"use client";

import { useAuthStore } from "@/stores";

export function useUserSession() {
  const userSession = useAuthStore((state) => state.sessionUser);
  const isLoading = useAuthStore((state) => state.isSessionLoading);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.sessionUser?.role ?? null);
  const lastSessionSyncAt = useAuthStore((state) => state.lastSessionSyncAt);

  return {
    userSession,
    isAdmin,
    isLoading,
    isAuthenticated,
    hasResolvedSession: Boolean(lastSessionSyncAt || userSession),
    role,
    hasGym: userSession?.hasGym ?? false,
  };
}
