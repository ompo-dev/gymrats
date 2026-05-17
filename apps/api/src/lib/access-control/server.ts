import { getAuthSession } from "@/lib/utils/middleware-auth";
import { checkAbility } from "./core";
import type { FeatureKey } from "./features";
import type {
  EnvironmentContext,
  UserContext,
  UserPlan,
  UserRole,
} from "./types";

/**
 * AuthorizationError
 * Erro lancado quando o usuario nao tem poder para acessar o recurso.
 */
export class AuthorizationError extends Error {
  constructor(message = "Acesso Negado. Voce nao possui o plano necessario.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Raw session object from db
function resolveActiveGymFromSession(sessionUser: any) {
  const gyms = Array.isArray(sessionUser?.gyms) ? sessionUser.gyms : [];
  if (sessionUser?.activeGymId) {
    // biome-ignore lint/suspicious/noExplicitAny: Array items are unknown here
    return gyms.find((gym: any) => gym?.id === sessionUser.activeGymId);
  }

  if (gyms.length === 1) {
    return gyms[0];
  }

  return undefined;
}

// biome-ignore lint/suspicious/noExplicitAny: Raw session object from db
function resolveGymPlanFromSession(sessionUser: any, gymId: string) {
  const gyms = Array.isArray(sessionUser?.gyms) ? sessionUser.gyms : [];
  // biome-ignore lint/suspicious/noExplicitAny: Array items are unknown here
  const gym = gyms.find((candidate: any) => candidate?.id === gymId);
  const subscriptionPlan =
    typeof gym?.subscription?.plan === "string" ? gym.subscription.plan : null;
  const legacyPlan = typeof gym?.plan === "string" ? gym.plan : null;
  const resolvedPlan = subscriptionPlan ?? legacyPlan;

  return resolvedPlan ? resolvedPlan.toUpperCase() : null;
}

// biome-ignore lint/suspicious/noExplicitAny: Raw session object from db
function buildEnvironmentContext(
  request: Request,
  sessionUser: any,
): EnvironmentContext | undefined {
  const gymContextId = request.headers.get("x-gym-context-id")?.trim();
  if (gymContextId) {
    const gymContextPlanHeader = request.headers
      .get("x-gym-context-plan")
      ?.trim();
    const gymContextPlan =
      gymContextPlanHeader?.toUpperCase() ??
      resolveGymPlanFromSession(sessionUser, gymContextId);

    if (gymContextPlan) {
      return {
        type: "GYM",
        id: gymContextId,
        plan: gymContextPlan,
      };
    }
  }

  const personalContextId = request.headers.get("x-personal-context-id")?.trim();
  const personalContextPlan = request.headers
    .get("x-personal-context-plan")
    ?.trim();

  if (personalContextId && personalContextPlan) {
    return {
      type: "PERSONAL",
      id: personalContextId,
      plan: personalContextPlan.toUpperCase(),
    };
  }

  return undefined;
}

/**
 * Constroi o UserContext a partir da sessao crua atual do banco.
 */
// biome-ignore lint/suspicious/noExplicitAny: Raw session object from db
export function buildUserContextFromSession(sessionUser: any): UserContext {
  let activePlan: UserPlan | null = null;
  let isSubscriptionActive = false;

  if (sessionUser?.role === "STUDENT") {
    const sub = sessionUser.student?.subscription;
    if (sub) {
      activePlan = sub.plan.toUpperCase() as UserPlan;
      isSubscriptionActive = sub.status === "active";
    } else {
      activePlan = "FREE";
      isSubscriptionActive = true;
    }
  } else if (sessionUser?.role === "GYM" || sessionUser?.role === "ADMIN") {
    const activeGym = resolveActiveGymFromSession(sessionUser);

    if (activeGym?.subscription) {
      activePlan = activeGym.subscription.plan.toUpperCase() as UserPlan;
      isSubscriptionActive = activeGym.subscription.status === "active";
    } else if (activeGym?.plan) {
      activePlan = activeGym.plan.toUpperCase() as UserPlan;
      isSubscriptionActive = true;
    }
  } else if (sessionUser?.role === "PERSONAL") {
    activePlan = null;
    isSubscriptionActive = false;
  }

  return {
    id: sessionUser?.id || "",
    role: (sessionUser?.role as UserRole) || "PENDING",
    activePlan,
    isSubscriptionActive,
  };
}

/**
 * Validar o acesso backend (uso em Server Actions e rotas).
 * Lanca erro caso usuario nao tenha a FeatureKey ou nao esteja logado.
 */
export async function requireAbility(
  feature: FeatureKey,
  requestObjForContext?: Request,
) {
  const requestParam = requestObjForContext || new Request("http://localhost");

  // biome-ignore lint/suspicious/noExplicitAny: Request type mismatch with internal utils
  const session = await getAuthSession(requestParam as any);

  if (!session || !session.user) {
    throw new AuthorizationError("Nao autenticado.");
  }

  const userContext = buildUserContextFromSession(session.user);
  const envContext = buildEnvironmentContext(requestParam, session.user);

  if (!checkAbility(userContext, feature, envContext)) {
    throw new AuthorizationError(
      `Acesso Negado (Requer feature: ${feature}). Assinatura invalida para este nivel.`,
    );
  }

  return userContext;
}
