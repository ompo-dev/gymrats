import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/lib/types";

interface AuthState {
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  userId: string | null;
  userRole: "STUDENT" | "GYM" | "ADMIN" | null;
  isAdmin: boolean;
  setAuthenticated: (authenticated: boolean) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setUserId: (id: string | null) => void;
  setUserRole: (role: "STUDENT" | "GYM" | "ADMIN" | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userProfile: null,
      userId: null,
      userRole: null,
      isAdmin: false,
      setAuthenticated: (authenticated) =>
        set({ isAuthenticated: authenticated }),
      setUserProfile: (profile) => set({ userProfile: profile }),
      setUserId: (id) => set({ userId: id }),
      setUserRole: (role) => set({ userRole: role, isAdmin: role === "ADMIN" }),
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      logout: () => {
        // Limpar localStorage também
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("userId");
          localStorage.removeItem("userRole");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("isAdmin");
          localStorage.removeItem("isAuthenticated");
          // Remover userMode se existir (migração)
          localStorage.removeItem("userMode");
        }
        set({
          isAuthenticated: false,
          userProfile: null,
          userId: null,
          userRole: null,
          isAdmin: false,
        });
      },
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        // Quando o Zustand restaura o estado do localStorage, sincronizar com auth_token
        if (typeof window !== "undefined" && state) {
          const token = localStorage.getItem("auth_token");
          const storedUserId = localStorage.getItem("userId");
          const storedUserRole = localStorage.getItem("userRole");

          // Se há token, garantir que está autenticado (fonte da verdade: auth_token)
          if (token) {
            state.isAuthenticated = true;
            state.userId = storedUserId || state.userId;
            // userRole deve ser "STUDENT", "GYM" ou "ADMIN"
            if (
              storedUserRole === "STUDENT" ||
              storedUserRole === "GYM" ||
              storedUserRole === "ADMIN"
            ) {
              state.userRole = storedUserRole as "STUDENT" | "GYM" | "ADMIN";
            }
            state.isAdmin = storedUserRole === "ADMIN";
          }
          // Se não há token, garantir que NÃO está autenticado
          else if (!token && state.isAuthenticated) {
            state.isAuthenticated = false;
            state.userProfile = null;
            state.userId = null;
            state.userRole = null;
            state.isAdmin = false;
          }
        }
      },
    }
  )
);
