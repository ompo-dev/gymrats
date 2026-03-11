"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores";

export function useUserSession() {
  const userSession = useAuthStore((state) => state.sessionUser);
  const isLoading = useAuthStore((state) => state.isSessionLoading);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const role = useAuthStore((state) => state.sessionUser?.role ?? null);
  const ensureSession = useAuthStore((state) => state.ensureSession);

  useEffect(() => {
    void ensureSession();
  }, [ensureSession]);

  return {
    userSession,
    isAdmin,
    isLoading,
    role,
    hasGym: userSession?.hasGym ?? false,
  };
}
