"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { authApi } from "@/lib/api/auth";
import { clearAuthToken, getAuthToken } from "@/lib/auth/token-client";
import { useAuthStore } from "@/stores";

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const { setAuthenticated, setUserId, setUserRole, logout } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      const token = getAuthToken();
      if (!token) return;

      try {
        const session = await authApi.getSession();

        if (!session?.user) {
          throw new Error("Sessao nao encontrada");
        }

        if (cancelled) return;

        setAuthenticated(true);
        setUserId(session.user.id);
        setUserRole(session.user.role);
      } catch (error) {
        if (cancelled) return;

        clearAuthToken();
        logout();
        console.error("[AuthSessionProvider] Erro ao reidratar sessao:", error);
      }
    }

    bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [logout, setAuthenticated, setUserId, setUserRole]);

  return children;
}
