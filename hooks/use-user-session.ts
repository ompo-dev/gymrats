"use client";

import { useState, useEffect } from "react";

interface UserSession {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "GYM" | "ADMIN";
  hasGym: boolean;
  hasStudent: boolean;
}

export function useUserSession() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      try {
        // Usar axios client (API → Component)
        const { apiClient } = await import("@/lib/api/client");
        const response = await apiClient.get<{ user: UserSession | null }>(
          "/api/auth/session",
          {
            timeout: 30000, // 30 segundos (aumentado de 10s)
          }
        );
        if (response.data.user) {
          setUserSession(response.data.user);
          setIsAdmin(response.data.user?.role === "ADMIN");
        } else {
          setUserSession(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Erro ao buscar sessão:", error);
        setUserSession(null);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSession();
  }, []);

  return {
    userSession,
    isAdmin,
    isLoading,
    role: userSession?.role || null,
  };
}

