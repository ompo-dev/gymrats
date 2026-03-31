"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAuthStore } from "@/stores";

function shouldHydrateSessionForCurrentPath(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const pathname = window.location.pathname;
  return ["/student", "/gym", "/personal"].some((prefix) =>
    pathname.startsWith(prefix),
  );
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const ensureSession = useAuthStore((state) => state.ensureSession);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSessionLoading = useAuthStore((state) => state.isSessionLoading);
  const sessionUser = useAuthStore((state) => state.sessionUser);

  useEffect(() => {
    if (sessionUser || isSessionLoading) {
      return;
    }

    if (!shouldHydrateSessionForCurrentPath() && !isAuthenticated) {
      return;
    }

    void ensureSession();
  }, [ensureSession, isAuthenticated, isSessionLoading, sessionUser]);

  return children;
}
