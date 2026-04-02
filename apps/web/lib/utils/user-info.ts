"use client";

import { webActions } from "@/lib/actions/client";
import { useAuthStore } from "@/stores/auth-store";

type UserInfo = {
  isAdmin: boolean;
  role: string | null;
};

function readUserInfoFromStore(): UserInfo {
  const state = useAuthStore.getState();

  return {
    isAdmin: state.isAdmin,
    role: state.userRole,
  };
}

/**
 * Compatibilidade para chamadas legadas.
 * A informação agora vem apenas do estado em memória, sincronizado com a sessão server-side.
 */
export function getUserInfoFromStorage(): UserInfo {
  return readUserInfoFromStore();
}

/**
 * Compatibilidade para chamadas legadas.
 * Nunca lê localStorage; depende apenas da sessão atual já validada.
 */
export function isAdminFromStorage(): boolean {
  return readUserInfoFromStore().isAdmin;
}

export async function getUserInfoFromServer(): Promise<UserInfo> {
  try {
    const response = await webActions.getAuthSessionAction();

    if (!response.user) {
      return { isAdmin: false, role: null };
    }

    const role = response.user.role;
    return {
      isAdmin: role === "ADMIN",
      role,
    };
  } catch {
    return { isAdmin: false, role: null };
  }
}
