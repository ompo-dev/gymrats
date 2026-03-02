export type UserRole = "STUDENT" | "GYM" | "PERSONAL" | "ADMIN" | "PENDING";

export type StudentPlan = "FREE" | "PREMIUM" | "PRO";
export type GymPlan = "BASIC" | "PREMIUM" | "ENTERPRISE";
export type PersonalPlan = "COM_IA" | "SUPERIOR";

export type UserPlan = StudentPlan | GymPlan | PersonalPlan | string; // Permitir fallback temporário para strings

// O contexto do usuário que será resgatado do Token ou Backend DB
export interface UserContext {
  id: string;
  role: UserRole;
  activePlan: UserPlan | null; // Null se PENDING/Sem Assinatura
  isSubscriptionActive: boolean; // false se inadimplente/cancelado
}

// O contexto do ambiente onde o usuário se encontra (Ex: Visitando dashboard da Academia XYZ)
export interface EnvironmentContext {
  type: "GYM" | "PERSONAL";
  id: string; // ID da Gym ou Personal associado no momento
  plan: GymPlan | PersonalPlan | string;
}
