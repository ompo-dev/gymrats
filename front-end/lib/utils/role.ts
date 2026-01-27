/**
 * Utilitários para trabalhar com roles
 */

export type UserRole = "STUDENT" | "GYM" | "ADMIN";

/**
 * Converte role para userType (mantido para compatibilidade com componentes legados)
 * @deprecated Use role diretamente. Esta função será removida no futuro.
 */
export function roleToUserType(role: UserRole | string | null | undefined): "student" | "gym" | null {
  if (!role) return null;
  
  const upperRole = role.toUpperCase();
  if (upperRole === "STUDENT") return "student";
  if (upperRole === "GYM") return "gym";
  if (upperRole === "ADMIN") return "gym"; // ADMIN pode acessar como gym
  
  return null;
}

/**
 * Verifica se o role é de um student
 */
export function isStudent(role: UserRole | string | null | undefined): boolean {
  if (!role) return false;
  return role.toUpperCase() === "STUDENT" || role.toUpperCase() === "ADMIN";
}

/**
 * Verifica se o role é de uma gym
 */
export function isGym(role: UserRole | string | null | undefined): boolean {
  if (!role) return false;
  return role.toUpperCase() === "GYM" || role.toUpperCase() === "ADMIN";
}

/**
 * Verifica se o role é admin
 */
export function isAdmin(role: UserRole | string | null | undefined): boolean {
  if (!role) return false;
  return role.toUpperCase() === "ADMIN";
}

