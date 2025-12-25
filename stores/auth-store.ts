import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { UserType, UserProfile } from "@/lib/types"

interface AuthState {
  isAuthenticated: boolean
  userMode: UserType | null
  userProfile: UserProfile | null
  userId: string | null
  userRole: string | null
  isAdmin: boolean
  setAuthenticated: (authenticated: boolean) => void
  setUserMode: (mode: UserType | null) => void
  setUserProfile: (profile: UserProfile | null) => void
  setUserId: (id: string | null) => void
  setUserRole: (role: string | null) => void
  setIsAdmin: (isAdmin: boolean) => void
  logout: () => void
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
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      setUserMode: (mode) => set({ userMode: mode }),
      setUserProfile: (profile) => set({ userProfile: profile }),
      setUserId: (id) => set({ userId: id }),
      setUserRole: (role) => set({ userRole: role, isAdmin: role === "ADMIN" }),
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      logout: () =>
        set({
          isAuthenticated: false,
          userMode: null,
          userProfile: null,
          userId: null,
          userRole: null,
          isAdmin: false,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
)

