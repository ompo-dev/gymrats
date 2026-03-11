import type { FeatureKey } from "./features";
import {
  GymInheritedFeatures,
  PersonalInheritedFeatures,
  RolePlanPolicies,
} from "./policies";
import type { EnvironmentContext, UserContext } from "./types";

/**
 * 🔐 core.ts
 * Motor Híbrido Avaliador ABAC/RBAC Central
 * Única fonte da verdade de "O Aluno Pode Gerar IA?"
 */

/**
 * Verifica se um user específico pode acessar a funcionalidade com base nas policies
 * diretas ligadas a que plano e assinatura ele está pagando na sua base de profile.
 */
function hasDirectAbility(user: UserContext, feature: FeatureKey): boolean {
  // Se user não tem conta ou assinatura pagante
  if (!user || user.role === "PENDING") return false;

  // Admin bypass (Sempre ganha passe livre)
  if (user.role === "ADMIN") return true;

  // O usuário precisa ter uma assinatura ativa para benefícios do plano passarem
  // Exceção seria se criássemos "Features Gratuitas", mas esse modelo não abarca no momento.
  // Se ele cancelou ou tá vencido, não entra nos ifs abaixo, caindo pro FREE

  // Mesmo quem é "FREE" entra aqui contanto que activePlan seja válido (ex: 'FREE')
  if (user.activePlan) {
    const planName = user.activePlan.toUpperCase();
    const roleTable = RolePlanPolicies[user.role] ?? {};

    const allowedFeatures = roleTable[planName];

    if (Array.isArray(allowedFeatures) && allowedFeatures.includes(feature)) {
      // Aqui valida se requeríamos pagar para esse plan specific e ele tá rodando:
      return true;
    }
  }

  return false;
}

/**
 * checkAbility
 * Verifica se a feature está destrancada, considerando o plano explícito do estudante
 * OU se ele está herdando magicamente tal funcionalidade baseado no lugar (Contexto) que ele pisar.
 */
export function checkAbility(
  user: UserContext,
  feature: FeatureKey,
  env?: EnvironmentContext,
): boolean {
  // 1. O usuário tem poder para fazer isso sozinho (comprou por conta própria)?
  if (hasDirectAbility(user, feature)) {
    return true;
  }

  // 2. Não comprou? Checar Herança Baseada onde ele está (Environment ABAC Context)
  // Cenário A: Ele tá num ambiente vinculado a uma ACADEMIA atual?
  if (env?.type === "GYM" && env.plan) {
    const gymPlanName = env.plan.toUpperCase();
    const allowedByGymParent =
      GymInheritedFeatures[gymPlanName as keyof typeof GymInheritedFeatures];

    if (
      Array.isArray(allowedByGymParent) &&
      allowedByGymParent.includes(feature)
    ) {
      return true;
    }
  }

  // Cenário B: Ele está num ambiente vinculado a um PERSONAL?
  if (env?.type === "PERSONAL" && env.plan) {
    const personalPlanName = env.plan.toUpperCase();
    const allowedByPersonalParent =
      PersonalInheritedFeatures[
        personalPlanName as keyof typeof PersonalInheritedFeatures
      ];

    if (
      Array.isArray(allowedByPersonalParent) &&
      allowedByPersonalParent.includes(feature)
    ) {
      return true;
    }
  }

  // Não liberou localmente nem pela herança do pai na relação. Recusado.
  return false;
}
