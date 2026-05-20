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

type SessionSubscription = {
  plan?: string | null;
  status?: string | null;
} | null;

type SessionGym = {
  id?: string | null;
  plan?: string | null;
  subscription?: SessionSubscription;
};

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

function normalizePlan(plan: unknown): string | null {
  if (typeof plan !== "string") {
    return null;
  }
  const normalized = plan.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

// biome-ignore lint/suspicious/noExplicitAny: Raw session object from db
function resolveGymFromSession(
  sessionUser: any,
  requestedGymId?: string,
): SessionGym | undefined {
  const gyms = Array.isArray(sessionUser?.gyms)
    ? (sessionUser.gyms as SessionGym[])
    : [];

  if (requestedGymId) {
    return gyms.find((candidate) => candidate?.id === requestedGymId);
  }

  const activeGym = resolveActiveGymFromSession(sessionUser) as
    | SessionGym
    | undefined;
  if (activeGym) {
    return activeGym;
  }

  return gyms.length === 1 ? gyms[0] : undefined;
}

function resolveEnvironmentPlanFromGym(gym: SessionGym): {
  plan: string;
  isSubscriptionActive: boolean;
} | null {
  const subscriptionPlan = normalizePlan(gym.subscription?.plan);
  if (subscriptionPlan) {
    return {
      plan: subscriptionPlan,
      isSubscriptionActive: gym.subscription?.status === "active",
    };
  }

  const legacyPlan = normalizePlan(gym.plan);
  if (legacyPlan) {
    return {
      plan: legacyPlan,
      isSubscriptionActive: true,
    };
  }

  return null;
}

function resolveEnvironmentPlanFromPersonal(sessionUser: any): {
  plan: string;
  isSubscriptionActive: boolean;
} | null {
  const personalSubscriptionPlan = normalizePlan(
    sessionUser?.personal?.subscription?.plan,
  );
  if (personalSubscriptionPlan) {
    return {
      plan: personalSubscriptionPlan,
      isSubscriptionActive:
        sessionUser?.personal?.subscription?.status === "active",
    };
  }

  const legacyPersonalPlan = normalizePlan(sessionUser?.personal?.plan);
  if (legacyPersonalPlan) {
    return {
      plan: legacyPersonalPlan,
      isSubscriptionActive: true,
    };
  }

  return null;
}

export function buildEnvironmentContext(
  request: Request,
  sessionUser: any,
): EnvironmentContext | undefined {
  const gymContextId = request.headers.get("x-gym-context-id")?.trim();
  const gym = resolveGymFromSession(sessionUser, gymContextId);
  if (gym?.id) {
    const resolved = resolveEnvironmentPlanFromGym(gym);
    if (resolved) {
      return {
        type: "GYM",
        id: String(gym.id),
        plan: resolved.plan,
        isSubscriptionActive: resolved.isSubscriptionActive,
      };
    }
  }

  const personalContextId =
    request.headers.get("x-personal-context-id")?.trim() || null;
  const sessionPersonalId =
    typeof sessionUser?.personal?.id === "string"
      ? sessionUser.personal.id
      : null;

  if (
    personalContextId &&
    sessionPersonalId &&
    personalContextId === sessionPersonalId
  ) {
    const resolved = resolveEnvironmentPlanFromPersonal(sessionUser);
    if (resolved) {
      return {
        type: "PERSONAL",
        id: personalContextId,
        plan: resolved.plan,
        isSubscriptionActive: resolved.isSubscriptionActive,
      };
    }
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
