import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserType, UserProfile } from "@/lib/types";

interface AuthState {
  isAuthenticated: boolean;
  userMode: UserType | null;
  userProfile: UserProfile | null;
  userId: string | null;
  userRole: string | null;
  isAdmin: boolean;
  setAuthenticated: (authenticated: boolean) => void;
  setUserMode: (mode: UserType | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setUserId: (id: string | null) => void;
  setUserRole: (role: string | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userMode: null,
      userProfile: null,
      userId: null,
      userRole: null,
      isAdmin: false,
      setAuthenticated: (authenticated) =>
        set({ isAuthenticated: authenticated }),
      setUserMode: (mode) => set({ userMode: mode }),
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
          localStorage.removeItem("userMode");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("isAdmin");
          localStorage.removeItem("isAuthenticated");
        }
        set({
          isAuthenticated: false,
          userMode: null,
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
          const storedUserMode = localStorage.getItem("userMode");

          // Se há token, garantir que está autenticado (fonte da verdade: auth_token)
          if (token) {
            state.isAuthenticated = true;
            state.userId = storedUserId || state.userId;
            state.userRole = storedUserRole || state.userRole;
            if (storedUserMode) {
              state.userMode = storedUserMode as UserType;
            } else if (storedUserRole) {
              // Se não tem userMode mas tem role, derivar do role
              state.userMode =
                storedUserRole === "STUDENT"
                  ? "student"
                  : storedUserRole === "GYM"
                  ? "gym"
                  : null;
            }
            state.isAdmin = storedUserRole === "ADMIN";
          }
          // Se não há token, garantir que NÃO está autenticado
          else if (!token && state.isAuthenticated) {
            state.isAuthenticated = false;
            state.userMode = null;
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
