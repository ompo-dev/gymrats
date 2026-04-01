"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import type { AuthSessionPayload } from "@/lib/actions/auth-readers";
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

export function AuthSessionProvider({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession?: AuthSessionPayload | null;
}) {
  const ensureSession = useAuthStore((state) => state.ensureSession);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSessionLoading = useAuthStore((state) => state.isSessionLoading);
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const syncSession = useAuthStore((state) => state.syncSession);
  const hasHydratedInitialSessionRef = useRef(false);

  useEffect(() => {
    if (hasHydratedInitialSessionRef.current || !initialSession) {
      return;
    }

    syncSession(initialSession);
    hasHydratedInitialSessionRef.current = true;
  }, [initialSession, syncSession]);

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
