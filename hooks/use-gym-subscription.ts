"use client";

import React from "react";
import type { GymSubscriptionData } from "./use-subscription-unified";
import { useSubscriptionUnified } from "./use-subscription-unified";

export type { GymSubscriptionData };

interface UseGymSubscriptionOptions {
  includeDaysRemaining?: boolean;
  includeTrialInfo?: boolean;
  includeActiveStudents?: boolean;
  enabled?: boolean;
}

type UseGymSubscriptionReturn = {
  subscription: GymSubscriptionData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
  startTrial: () => Promise<{ success?: boolean; error?: string }>;
  isStartingTrial: boolean;
  createSubscription: (
    plan: "basic" | "premium" | "enterprise",
    billingPeriod?: "monthly" | "annual",
    referralCode?: string | null,
  ) => Promise<{ billingUrl?: string; error?: string }>;
  isCreatingSubscription: boolean;
  cancelSubscription: () => Promise<{ success?: boolean; error?: string }>;
  isCancelingSubscription: boolean;
};

export function useGymSubscription(
  options?: UseGymSubscriptionOptions,
): UseGymSubscriptionReturn {
  const memoizedOptions = React.useMemo(
    () => ({
      userType: "gym" as const,
      ...options,
    }),
    [
      options?.enabled,
      options?.includeDaysRemaining,
      options?.includeTrialInfo,
      options?.includeActiveStudents,
    ],
  );

  const result = useSubscriptionUnified(memoizedOptions);

  return {
    ...result,
    subscription: result.subscription as GymSubscriptionData | null,
    createSubscription: result.createSubscription as (
      plan: "basic" | "premium" | "enterprise",
      billingPeriod?: "monthly" | "annual",
      referralCode?: string | null,
    ) => Promise<{ billingUrl?: string; error?: string }>,
  };
}
