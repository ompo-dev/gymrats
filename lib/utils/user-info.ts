"use client";

/**
 * Busca informações do usuário do localStorage (rápido, sem delay)
 * Útil para verificar se é admin imediatamente após login
 */
export function getUserInfoFromStorage(): { isAdmin: boolean; role: string | null } {
  if (typeof window === "undefined") {
    return { isAdmin: false, role: null };
  }

  const role = localStorage.getItem("userRole");
  const isAdminStorage = localStorage.getItem("isAdmin");
  
  const isAdmin = role === "ADMIN" || isAdminStorage === "true";
  
  return {
    isAdmin,
    role: role || null,
  };
}

/**
 * Verifica se o usuário é admin baseado no localStorage
 */
export function isAdminFromStorage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const role = localStorage.getItem("userRole");
  const isAdminStorage = localStorage.getItem("isAdmin");
  
  return role === "ADMIN" || isAdminStorage === "true";
}

