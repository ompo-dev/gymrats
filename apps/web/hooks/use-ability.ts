"use client";

import { useMemo } from "react";
import { useEnvironment } from "@/components/providers/environment-provider";
import { useUserSession } from "@/hooks/use-user-session";
import { checkAbility } from "@/lib/access-control/core";
import type { FeatureKey } from "@/lib/access-control/features";
import type { UserContext } from "@/lib/access-control/types";

/**
 * 🎣 useAbility
 * Hook fundamental para o controle de features condicionado a pagamentos via Client-Side.
 * Esconde e/ou mostra botões se a matriz de acesso validar com o usuário logado
 */
export function useAbility() {
  const { userSession } = useUserSession();
  const { environment } = useEnvironment();

  // Construir context local idêntico ao server
  const userContext = useMemo(() => {
    if (!userSession) return null;

    let plan = "FREE";
    let status = false;

    // As assinaturas reais provavelmente estão no studentStore ou gymStore,
    // o auth session puro pode não trazer. Se no futuro userSession
    // preencher activePlan nativamente, usaremos ele direto.
    // Temporariamente faremos inferência de fallback.
    if (userSession.role === "STUDENT") {
      // biome-ignore lint/suspicious/noExplicitAny: need any here for fallback property access
      const activeSup = (userSession as any)?.student?.subscription;
      if (activeSup) {
        plan = activeSup.plan;
        status = activeSup.status === "active";
      }
    } else if (userSession.role === "GYM") {
      type GymSessionFallback = {
        activeGymId?: string;
        gyms?: Array<{
          id: string;
          plan?: string;
          subscription?: { plan: string; status: string };
        }>;
      };
      const activeGym =
        (userSession as GymSessionFallback)?.gyms?.find(
          (g) => g.id === (userSession as GymSessionFallback).activeGymId,
        ) || (userSession as GymSessionFallback)?.gyms?.[0];
      if (activeGym?.subscription) {
        plan = activeGym.subscription.plan;
        status = activeGym.subscription.status === "active";
      } else if (activeGym?.plan) {
        plan = activeGym.plan;
        status = true;
      }
    }

    return {
      id: userSession.id,
      role: userSession.role,
      activePlan: plan.toUpperCase(),
      isSubscriptionActive: status,
    };
  }, [userSession]);

  /**
   * Função principal de verificação. Avalia não só explícitos, mas em qual lugar
   * a pessoa tá se o `injectedEnvironment` for injetado (via provider).
   */
  const can = (feature: FeatureKey): boolean => {
    if (!userContext) return false;
    return checkAbility(
      userContext as unknown as UserContext,
      feature,
      environment,
    );
  };

  return {
    can,
    isLoading: !userSession,
    userContext,
  };
}
