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
 * 🚨 AuthorizationError
 * Erro lançado quando o usuário não tem poder para acessar o recurso.
 */
export class AuthorizationError extends Error {
  constructor(message = "Acesso Negado. Você não possui o plano necessário.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Constrói o UserContext a partir da Sessão crua atual do banco
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
      activePlan = "FREE"; // Fallback pra student
      isSubscriptionActive = true;
    }
  } else if (sessionUser?.role === "GYM" || sessionUser?.role === "ADMIN") {
    // Pega a gym atual ativa.
    const activeGym =
      // biome-ignore lint/suspicious/noExplicitAny: Array items are unknown here
      sessionUser.gyms?.find((g: any) => g.id === sessionUser.activeGymId) ||
      sessionUser.gyms?.[0];

    if (activeGym?.subscription) {
      activePlan = activeGym.subscription.plan.toUpperCase() as UserPlan;
      isSubscriptionActive = activeGym.subscription.status === "active";
    } else if (activeGym?.plan) {
      activePlan = activeGym.plan.toUpperCase() as UserPlan; // legacy ou default básico
      isSubscriptionActive = true;
    }
  } else if (sessionUser?.role === "PERSONAL") {
    // Lógica pro personal assim que o schema for atualizado com as assinaturas dele
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
 * Validar o acesso backend (Para uso dentro de Server Actions e Rotas Elysia).
 * Lança um erro caso o usuário não tenha o FeatureKey ou se não estiver logado.
 */
export async function requireAbility(
  feature: FeatureKey,
  requestObjForContext?: Request, // Opcional: Se for passado, extraímos infos do Environment (Ex: Gym atual visitada via Header)
) {
  const requestParam = requestObjForContext || new Request("http://localhost");

  // biome-ignore lint/suspicious/noExplicitAny: Request type mismatch with internal utils
  const session = await getAuthSession(requestParam as any);

  if (!session || !session.user) {
    throw new AuthorizationError("Não autenticado.");
  }

  const userContext = buildUserContextFromSession(session.user);

  // ⚠️ Aqui poderíamos extrair o environmentContext se passássemos um header customizado
  // da UI pro fetch informando em que 'página' estamo (Ex: "x-gym-context-id": "123").
  // Mas na primeira iteração avaliamos o direto.
  let envContext: EnvironmentContext | undefined;

  if (!checkAbility(userContext, feature, envContext)) {
    throw new AuthorizationError(
      `Acesso Negado (Requer feature: ${feature}). Assinatura inválida para este nível.`,
    );
  }

  return userContext;
}
