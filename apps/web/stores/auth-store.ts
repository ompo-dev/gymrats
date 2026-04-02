import { create } from "zustand";
import type { AuthSessionPayload } from "@/lib/actions/auth-readers";
import { webActions } from "@/lib/actions/client";
import { clearAuthToken, hasBrowserSessionHint } from "@/lib/auth/token-client";
import type { UserProfile } from "@/lib/types";

const SESSION_TTL_MS = 60_000;

let sessionPromise: Promise<AuthSessionUser | null> | null = null;

export type AuthRole =
  | "PENDING"
  | "STUDENT"
  | "GYM"
  | "PERSONAL"
  | "ADMIN"
  | null;

export interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
  role: Exclude<AuthRole, null>;
  hasGym: boolean;
  hasStudent: boolean;
  activeGymId?: string | null;
  gyms?: Array<{
    id: string;
    plan?: string;
    subscription?: {
      plan: string;
      status: string;
      currentPeriodEnd?: string | Date | null;
    } | null;
  }>;
  student?: {
    id: string;
    subscription?: {
      plan: string;
      status: string;
      currentPeriodEnd?: string | Date | null;
    } | null;
  } | null;
  [key: string]: unknown;
}

type SessionResponse = AuthSessionPayload;

interface AuthState {
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  userId: string | null;
  userRole: Exclude<AuthRole, "PENDING"> | null;
  isAdmin: boolean;
  sessionUser: AuthSessionUser | null;
  isSessionLoading: boolean;
  sessionError: string | null;
  lastSessionSyncAt: Date | null;
  setAuthenticated: (authenticated: boolean) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setUserId: (id: string | null) => void;
  setUserRole: (role: Exclude<AuthRole, "PENDING"> | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  syncSession: (payload: SessionResponse | null) => void;
  ensureSession: (force?: boolean) => Promise<AuthSessionUser | null>;
  invalidateSession: () => void;
  logout: () => void;
  signOut: () => Promise<void>;
}

function clearLocalAuthStorage() {
  if (typeof window === "undefined") return;

  clearAuthToken();
  localStorage.removeItem("userId");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("userMode");
  localStorage.removeItem("auth-storage");
}

function normalizeRole(
  role: AuthSessionUser["role"] | Exclude<AuthRole, "PENDING"> | null,
): Exclude<AuthRole, "PENDING"> | null {
  if (
    role === "STUDENT" ||
    role === "GYM" ||
    role === "PERSONAL" ||
    role === "ADMIN"
  ) {
    return role;
  }

  return null;
}

function isSessionFresh(lastSessionSyncAt: Date | null) {
  if (!lastSessionSyncAt) return false;
  return Date.now() - new Date(lastSessionSyncAt).getTime() < SESSION_TTL_MS;
}

function applySessionToState(
  set: (
    partial: Partial<AuthState> | ((state: AuthState) => Partial<AuthState>),
  ) => void,
  payload: SessionResponse | null,
) {
  const user = payload?.user ?? null;

  if (!user) {
    clearLocalAuthStorage();
    set({
      isAuthenticated: false,
      userId: null,
      userRole: null,
      isAdmin: false,
      sessionUser: null,
      isSessionLoading: false,
      sessionError: null,
      lastSessionSyncAt: new Date(),
    });
    return;
  }

  const normalizedRole = normalizeRole(user.role);

  set({
    isAuthenticated: true,
    userId: user.id,
    userRole: normalizedRole,
    isAdmin: user.role === "ADMIN",
    sessionUser: user,
    isSessionLoading: false,
    sessionError: null,
    lastSessionSyncAt: new Date(),
  });
}

async function requestSession() {
  return (await webActions.getAuthSessionAction()) ?? null;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  isAuthenticated: hasBrowserSessionHint(),
  userProfile: null,
  userId: null,
  userRole: null,
  isAdmin: false,
  sessionUser: null,
  isSessionLoading: false,
  sessionError: null,
  lastSessionSyncAt: null,
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setUserId: (id) =>
    set((state) => ({
      userId: id,
      sessionUser: state.sessionUser
        ? {
            ...state.sessionUser,
            id: id ?? state.sessionUser.id,
          }
        : state.sessionUser,
    })),
  setUserRole: (role) =>
    set((state) => ({
      userRole: role,
      isAdmin: role === "ADMIN",
      sessionUser:
        role && state.sessionUser
          ? {
              ...state.sessionUser,
              role,
            }
          : state.sessionUser,
    })),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  syncSession: (payload) => {
    applySessionToState(set, payload);
  },
  ensureSession: async (force = false) => {
    const state = get();
    if (!force && state.sessionUser && isSessionFresh(state.lastSessionSyncAt)) {
      return state.sessionUser;
    }

    if (!force && sessionPromise) {
      return sessionPromise;
    }

    sessionPromise = (async () => {
      set({ isSessionLoading: true, sessionError: null });

      try {
        if (!force && !state.isAuthenticated && !hasBrowserSessionHint()) {
          applySessionToState(set, null);
          return null;
        }

        const payload = await requestSession().catch(() => null);

        applySessionToState(set, payload);
        return payload?.user ?? null;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao validar sessao";

        set({
          isSessionLoading: false,
          sessionError: message,
        });

        return null;
      } finally {
        sessionPromise = null;
      }
    })();

    return sessionPromise;
  },
  invalidateSession: () => {
    set({ lastSessionSyncAt: null, sessionError: null });
  },
  logout: () => {
    clearLocalAuthStorage();
    set({
      isAuthenticated: false,
      userProfile: null,
      userId: null,
      userRole: null,
      isAdmin: false,
      sessionUser: null,
      isSessionLoading: false,
      sessionError: null,
      lastSessionSyncAt: null,
    });
  },
  signOut: async () => {
    try {
      await webActions.signOutAction();
    } catch {
      // Continua mesmo se o backend falhar para nao prender a sessao local.
    } finally {
      get().logout();
    }
  },
}));
