import { type FeatureKey, Features } from "./features";
import type { GymPlan, PersonalPlan, StudentPlan, UserRole } from "./types";

/**
 * policies.ts
 * Define claramente e objetivamente quais planos em cada Role (Espaço Base) dão direito e quais features explícitas (Pagantes).
 */

type PlanPolicy<T extends string> = Record<T, FeatureKey[]>;

// Matrizes de Base

const STUDENT_POLICIES: PlanPolicy<StudentPlan> = {
  FREE: [],
  PREMIUM: [Features.USE_AI_WORKOUT, Features.USE_AI_NUTRITION],
  PRO: [
    Features.USE_AI_WORKOUT,
    Features.USE_AI_NUTRITION,
    Features.NETWORK_ACCESS,
  ],
};

const GYM_POLICIES: PlanPolicy<GymPlan> = {
  BASIC: [],
  PREMIUM: [Features.ADVANCED_REPORTS],
  ENTERPRISE: [Features.ADVANCED_REPORTS, Features.ASSIGN_PERSONAL],
};

const PERSONAL_POLICIES: PlanPolicy<PersonalPlan> = {
  COM_IA: [Features.USE_AI_WORKOUT],
  SUPERIOR: [Features.USE_AI_WORKOUT, Features.USE_AI_NUTRITION],
};

// Matriz Base
// Admin sempre tem tudo de tudo
export const RolePlanPolicies: Record<
  UserRole,
  Partial<Record<string, FeatureKey[]>>
> = {
  STUDENT: STUDENT_POLICIES,
  GYM: GYM_POLICIES,
  PERSONAL: PERSONAL_POLICIES,
  ADMIN: {}, // God mode (tratado direto no core)
  PENDING: {},
};

// ============================================
// CROSS-ENVIRONMENT (HERANÇAS RELACIONAIS)
// ============================================

/**
 * Se o usuário não pagou o próprio Premium, mas a "Academia Contexto" em que
 * ele está logado/filiado tiver um dos Planos abaixo, as features repassadas
 * como herança pra quem frequenta estão declaradas aqui.
 */

export const GymInheritedFeatures: Partial<Record<GymPlan, FeatureKey[]>> = {
  BASIC: [],
  PREMIUM: [],
  // Cenario: Academia Enterprise = Aluno Premium Grátis dentro do espaço da academia.
  ENTERPRISE: [Features.USE_AI_WORKOUT, Features.USE_AI_NUTRITION],
};

export const PersonalInheritedFeatures: Partial<
  Record<PersonalPlan, FeatureKey[]>
> = {
  COM_IA: [],
  SUPERIOR: [],
};
