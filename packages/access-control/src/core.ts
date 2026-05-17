import type { FeatureKey } from "./features";
import {
  GymInheritedFeatures,
  PersonalInheritedFeatures,
  RolePlanPolicies,
} from "./policies";
import type { EnvironmentContext, UserContext } from "./types";

/**
 * core.ts
 * Motor hibrido avaliador ABAC/RBAC central.
 */

/**
 * Verifica se um user especifico pode acessar a funcionalidade com base nas policies
 * diretas ligadas ao plano e status de assinatura dele.
 */
function hasDirectAbility(user: UserContext, feature: FeatureKey): boolean {
  if (!user || user.role === "PENDING") return false;

  // Admin bypass (sempre permitido)
  if (user.role === "ADMIN") return true;

  if (!user.activePlan) return false;

  const planName = user.activePlan.toUpperCase();
  const roleTable = RolePlanPolicies[user.role] ?? {};
  const allowedFeatures = roleTable[planName];
  if (!Array.isArray(allowedFeatures) || !allowedFeatures.includes(feature)) {
    return false;
  }

  // Fail-closed: qualquer plano pago exige assinatura ativa.
  // Excecao: FREE pode manter features gratuitas declaradas em policy.
  if (user.isSubscriptionActive) return true;
  return planName === "FREE";
}

/**
 * checkAbility
 * Verifica se a feature esta destrancada, considerando o plano explicito do usuario
 * ou heranca de contexto (academia/personal).
 */
export function checkAbility(
  user: UserContext,
  feature: FeatureKey,
  env?: EnvironmentContext,
): boolean {
  if (hasDirectAbility(user, feature)) {
    return true;
  }

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

  return false;
}
