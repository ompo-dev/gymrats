"use client";

import { useEffect, useRef } from "react";
import type { AuthSessionPayload } from "@/lib/actions/auth-readers";
import { useAuthStore } from "@/stores";

export function AuthSessionSeedClient({
  initialSession,
}: {
  initialSession: AuthSessionPayload | null;
}) {
  const syncSession = useAuthStore((state) => state.syncSession);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (hasSyncedRef.current || !initialSession) {
      return;
    }

    syncSession(initialSession);
    hasSyncedRef.current = true;
  }, [initialSession, syncSession]);

  return null;
}
