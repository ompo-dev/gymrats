"use client";

import { useCallback, useEffect, useState } from "react";

interface UserSession {
  id: string;
  email: string;
  name: string;
  role: "PENDING" | "STUDENT" | "GYM" | "PERSONAL" | "ADMIN";
  hasGym: boolean;
  hasStudent: boolean;
}

let sessionPromise: Promise<UserSession | null> | null = null;
let cachedSession: UserSession | null | undefined;
let cacheAt = 0;
const SESSION_TTL_MS = 5000;

const SESSION_TIMEOUT_MS = 45000; // Mais tempo para cold start (Vercel)
const RETRY_DELAY_MS = 3000;

/** Invalida o cache para forçar nova busca na próxima chamada */
function invalidateSessionCache() {
  cachedSession = undefined;
  cacheAt = 0;
  sessionPromise = null;
}

async function fetchSessionSingleFlight(): Promise<UserSession | null> {
  const now = Date.now();
  if (cachedSession !== undefined && now - cacheAt < SESSION_TTL_MS) {
    return cachedSession;
  }

  if (!sessionPromise) {
    sessionPromise = (async () => {
      const { apiClient } = await import("@/lib/api/client");
      let lastError: unknown;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await apiClient.get<{ user: UserSession | null }>(
            "/api/auth/session",
            { timeout: SESSION_TIMEOUT_MS },
          );
          cachedSession = response.data.user ?? null;
          cacheAt = Date.now();
          return cachedSession;
        } catch (err) {
          lastError = err;
          const isRetryable =
            (err && typeof err === "object" && "code" in err &&
              (err as { code?: string }).code === "ECONNABORTED") ||
            (err && typeof err === "object" && "message" in err &&
              String((err as { message?: string }).message).includes("timeout"));
          if (attempt === 0 && isRetryable) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          } else {
            throw err;
          }
        }
      }
      throw lastError;
    })().finally(() => {
      sessionPromise = null;
    });
  }

  return sessionPromise;
}

export function useUserSession() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const applySession = useCallback((session: UserSession | null) => {
    if (session) {
      setUserSession(session);
      setIsAdmin(session.role === "ADMIN");
    } else {
      setUserSession(null);
      setIsAdmin(false);
    }
  }, []);

  const retry = useCallback(async () => {
    invalidateSessionCache();
    setIsLoading(true);
    try {
      const session = await fetchSessionSingleFlight();
      applySession(session);
    } catch (error) {
      console.error("Erro ao buscar sessão:", error);
      applySession(null);
    } finally {
      setIsLoading(false);
    }
  }, [applySession]);

  useEffect(() => {
    async function fetchSession() {
      try {
        const session = await fetchSessionSingleFlight();
        applySession(session);
      } catch (error) {
        console.error("Erro ao buscar sessão:", error);
        applySession(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSession();
  }, [applySession]);

  return {
    userSession,
    isAdmin,
    isLoading,
    retry,
    role: (userSession?.role ?? null) as
      | "PENDING"
      | "STUDENT"
      | "GYM"
      | "PERSONAL"
      | "ADMIN"
      | null,
    hasGym: userSession?.hasGym ?? false,
  };
}
