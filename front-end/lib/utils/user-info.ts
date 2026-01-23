"use client";

/**
 * ⚠️ SEGURANÇA: Estas funções são INSECURAS e devem ser usadas APENAS para UX (mostrar/esconder elementos).
 * NUNCA use para autorização real - sempre valide no servidor!
 *
 * localStorage pode ser facilmente modificado pelo usuário.
 * Use estas funções apenas para melhorar a experiência do usuário (ex: mostrar/esconder botões).
 * Toda autorização real DEVE ser validada no servidor via cookies/sessão.
 */

/**
 * ⚠️ INSECURO: Busca informações do usuário do localStorage
 *
 * ATENÇÃO: Esta função é INSECURA e deve ser usada APENAS para UX.
 * NUNCA use para autorização - sempre valide no servidor!
 *
 * @deprecated Use useUserSession() ou valide no servidor
 */
export function getUserInfoFromStorage(): {
  isAdmin: boolean;
  role: string | null;
} {
  if (typeof window === "undefined") {
    return { isAdmin: false, role: null };
  }

  const role = localStorage.getItem("userRole");
  const isAdminStorage = localStorage.getItem("isAdmin");

  // ⚠️ INSECURO: localStorage pode ser modificado pelo usuário
  const isAdmin = role === "ADMIN" || isAdminStorage === "true";

  return {
    isAdmin,
    role: role || null,
  };
}

/**
 * ⚠️ INSECURO: Verifica se o usuário é admin baseado no localStorage
 *
 * ATENÇÃO: Esta função é INSECURA e deve ser usada APENAS para UX.
 * NUNCA use para autorização - sempre valide no servidor!
 *
 * @deprecated Use useUserSession() ou valide no servidor
 */
export function isAdminFromStorage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const role = localStorage.getItem("userRole");
  const isAdminStorage = localStorage.getItem("isAdmin");

  // ⚠️ INSECURO: localStorage pode ser modificado pelo usuário
  return role === "ADMIN" || isAdminStorage === "true";
}

/**
 * ✅ SEGURO: Busca informações do usuário validando no servidor
 *
 * Esta função sempre valida no servidor via API, garantindo segurança.
 * Use esta função para autorização real.
 */
export async function getUserInfoFromServer(): Promise<{
  isAdmin: boolean;
  role: string | null;
}> {
  try {
    const { apiClient } = await import("@/lib/api/client");
    const response = await apiClient.get<{
      user: { role: "STUDENT" | "GYM" | "ADMIN" } | null;
    }>("/api/auth/session");

    if (!response.data.user) {
      return { isAdmin: false, role: null };
    }

    const role = response.data.user.role;
    const isAdmin = role === "ADMIN";

    return { isAdmin, role };
  } catch (error) {
    console.error(
      "[getUserInfoFromServer] Erro ao buscar informações do servidor:",
      error
    );
    return { isAdmin: false, role: null };
  }
}
