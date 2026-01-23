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
          // Limpar auth-storage do Zustand
          localStorage.removeItem("auth-storage");
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
      // ⚠️ SEGURANÇA: NÃO persistir userRole e isAdmin no localStorage
      // Estes valores podem ser modificados pelo usuário e não devem ser usados para autorização
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userProfile: state.userProfile,
        userId: state.userId,
        // userRole e isAdmin NÃO são persistidos - sempre validar no servidor
      }),
      onRehydrateStorage: () => (state) => {
        // ⚠️ SEGURANÇA: localStorage pode ser modificado pelo usuário
        // Este rehydrate é apenas para UX inicial - sempre validar no servidor depois
        if (typeof window !== "undefined" && state) {
          // ⚠️ SEGURANÇA: Limpar valores antigos e inseguros do localStorage
          // Remover userRole e isAdmin do localStorage se existirem (valores antigos)
          localStorage.removeItem("userRole");
          localStorage.removeItem("isAdmin");

          const token = localStorage.getItem("auth_token");
          const storedUserId = localStorage.getItem("userId");

          // Se há token, restaurar estado inicial (apenas para UX)
          // ⚠️ IMPORTANTE: Este estado NÃO deve ser usado para autorização real
          // Sempre validar no servidor via API antes de permitir ações sensíveis
          if (token) {
            state.isAuthenticated = true;
            state.userId = storedUserId || state.userId;
            // ⚠️ SEGURANÇA: userRole e isAdmin NÃO são restaurados do localStorage
            // Eles devem ser sempre obtidos do servidor via useUserSession()
            // Sempre definir como null/false para garantir que não são usados para autorização
            state.userRole = null;
            state.isAdmin = false;
          }
          // Se não há token, garantir que NÃO está autenticado
          else if (!token && state.isAuthenticated) {
            state.isAuthenticated = false;
            state.userProfile = null;
            state.userId = null;
            state.userRole = null;
            state.isAdmin = false;
          } else {
            // Mesmo sem token, garantir que userRole e isAdmin estão limpos
            state.userRole = null;
            state.isAdmin = false;
          }
        }
      },
    }
  )
);
