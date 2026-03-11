"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { authApi } from "@/lib/api/auth";
import {
  ensureAuthToken,
  getAuthToken,
  refreshAuthToken,
  setAuthToken,
} from "@/lib/auth/token-client";
import { useAuthStore } from "@/stores";

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const { setAuthenticated, setUserId, setUserRole } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      const token = getAuthToken() || (await ensureAuthToken());
      if (!token) return;

      try {
        let session = await authApi.getSession();

        if (!session?.user) {
          const refreshedToken = await refreshAuthToken();

          if (cancelled || !refreshedToken) {
            return;
          }

          session = await authApi.getSession();
        }

        if (!session?.user) {
          return;
        }

        if (cancelled) return;

        if (session.session?.token) {
          setAuthToken(session.session.token);
        }

        setAuthenticated(true);
        setUserId(session.user.id);
        setUserRole(session.user.role);
      } catch (error) {
        if (cancelled) return;
        console.error("[AuthSessionProvider] Erro ao reidratar sessao:", error);
      }
    }

    bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [setAuthenticated, setUserId, setUserRole]);

  return children;
}
