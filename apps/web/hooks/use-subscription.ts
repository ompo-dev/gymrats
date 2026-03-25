"use client";

import React from "react";
import {
  type StudentSubscriptionData,
  useSubscriptionUnified,
} from "./use-subscription-unified";
import { useUserSession } from "./use-user-session";

export type SubscriptionData = StudentSubscriptionData;

interface UseSubscriptionOptions {
  includeDaysRemaining?: boolean;
  includeTrialInfo?: boolean;
  enabled?: boolean;
}

type UseSubscriptionReturn = {
  subscription: StudentSubscriptionData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  isFirstPayment: boolean;
  startTrial: () => Promise<{ success?: boolean; error?: string }>;
  isStartingTrial: boolean;
  createSubscription: (
    plan: "monthly" | "annual",
    referralCode?: string | null,
  ) => Promise<{ billingUrl?: string; error?: string }>;
  isCreatingSubscription: boolean;
  cancelSubscription: () => Promise<{ success?: boolean; error?: string }>;
  isCancelingSubscription: boolean;
};

/** Subscription para student. Para gym, use useGymSubscription. */
export function useSubscription(
  options?: UseSubscriptionOptions,
): UseSubscriptionReturn {
  const memoizedOptions = React.useMemo(
    () => ({
      userType: "student" as const,
      ...options,
    }),
    [
      options?.enabled,
      options?.includeDaysRemaining,
      options?.includeTrialInfo,
    ],
  );

  const result = useSubscriptionUnified(memoizedOptions);

  return {
    ...result,
    subscription: result.subscription as StudentSubscriptionData | null,
    createSubscription: result.createSubscription as (
      plan: "monthly" | "annual",
      referralCode?: string | null,
    ) => Promise<{ billingUrl?: string; error?: string }>,
  };
}

/**
 * Detecta contexto (student vs gym) via useUserSession e retorna subscription apropriada.
 * Útil em componentes compartilhados.
 */
export function useSubscriptionByContext() {
  const { role, hasGym } = useUserSession();
  const userType =
    role === "GYM" || (role === "ADMIN" && hasGym) ? "gym" : "student";
  return useSubscriptionUnified({ userType });
}
