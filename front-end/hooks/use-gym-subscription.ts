"use client";

import { useSubscriptionUnified } from "./use-subscription-unified";
import type { GymSubscriptionData } from "./use-subscription-unified";

export type { GymSubscriptionData };

interface UseGymSubscriptionOptions {
  includeDaysRemaining?: boolean;
  includeTrialInfo?: boolean;
  includeActiveStudents?: boolean;
}

type UseGymSubscriptionReturn = {
  subscription: GymSubscriptionData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
  startTrial: () => Promise<{ success?: boolean; error?: string }>;
  isStartingTrial: boolean;
  createSubscription: (plan: "basic" | "premium" | "enterprise", billingPeriod?: "monthly" | "annual") => Promise<{ billingUrl?: string; error?: string }>;
  isCreatingSubscription: boolean;
  cancelSubscription: () => Promise<{ success?: boolean; error?: string }>;
  isCancelingSubscription: boolean;
};

export function useGymSubscription(options?: UseGymSubscriptionOptions): UseGymSubscriptionReturn {
  const result = useSubscriptionUnified({
    userType: "gym",
    ...options,
  });
  
  return {
    ...result,
    subscription: result.subscription as GymSubscriptionData | null,
    createSubscription: result.createSubscription as (plan: "basic" | "premium" | "enterprise", billingPeriod?: "monthly" | "annual") => Promise<{ billingUrl?: string; error?: string }>,
  };
}

