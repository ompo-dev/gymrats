"use client";

import { useState, useEffect } from "react";

interface UserSession {
  id: string;
  email: string;
  name: string;
  userType: "student" | "gym" | "admin" | null;
  role: string;
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
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setUserSession(data.user);
          setIsAdmin(data.user?.role === "ADMIN" || data.user?.userType === "admin");
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
    userType: userSession?.userType || null,
  };
}

