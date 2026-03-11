"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  type GymSubscriptionData,
  type StudentSubscriptionData,
  useSubscriptionStore,
} from "@/stores/subscription-store";

export type { GymSubscriptionData, StudentSubscriptionData };
export type SubscriptionData = StudentSubscriptionData | GymSubscriptionData;

interface UseSubscriptionOptions {
  userType: "student" | "gym";
  includeDaysRemaining?: boolean;
  includeTrialInfo?: boolean;
  includeActiveStudents?: boolean;
  enabled?: boolean;
}

export function useSubscriptionUnified(options: UseSubscriptionOptions) {
  const { userType, enabled = true } = options;

  const subscription = useSubscriptionStore((state) =>
    userType === "student" ? state.subscription : state.gymSubscription,
  );
  const meta = useSubscriptionStore((state) =>
    userType === "student" ? state.studentMeta : state.gymMeta,
  );
  const loadSubscription = useSubscriptionStore((state) => state.loadSubscription);
  const startTrialStore = useSubscriptionStore((state) => state.startTrial);
  const createSubscriptionStore = useSubscriptionStore(
    (state) => state.createSubscription,
  );
  const cancelSubscriptionStore = useSubscriptionStore(
    (state) => state.cancelSubscription,
  );

  useEffect(() => {
    if (!enabled) return;
    void loadSubscription(userType);
  }, [enabled, loadSubscription, userType]);

  const refetch = useCallback(() => loadSubscription(userType, true), [
    loadSubscription,
    userType,
  ]);

  const startTrial = useCallback(() => startTrialStore(userType), [
    startTrialStore,
    userType,
  ]);

  const createSubscription = useCallback(
    (
      ...args:
        | [plan: "monthly" | "annual", referralCode?: string | null]
        | [
            plan: "basic" | "premium" | "enterprise",
            billingPeriod?: "monthly" | "annual",
            referralCode?: string | null,
          ]
    ) => {
      if (userType === "student") {
        const [plan, referralCode] = args as [
          "monthly" | "annual",
          string | null | undefined,
        ];

        return createSubscriptionStore("student", {
          plan,
          referralCode: referralCode || undefined,
        });
      }

      const [plan, billingPeriod = "monthly", referralCode] = args as [
        "basic" | "premium" | "enterprise",
        "monthly" | "annual" | undefined,
        string | null | undefined,
      ];

      return createSubscriptionStore("gym", {
        plan,
        billingPeriod,
        referralCode: referralCode || undefined,
      });
    },
    [createSubscriptionStore, userType],
  );

  const cancelSubscription = useCallback(
    () => cancelSubscriptionStore(userType),
    [cancelSubscriptionStore, userType],
  );

  return useMemo(
    () => ({
      subscription: subscription as SubscriptionData | null,
      isFirstPayment: meta.isFirstPayment,
      isLoading: enabled ? meta.isLoading : false,
      error: meta.error ? new Error(meta.error) : null,
      refetch,
      startTrial,
      isStartingTrial: meta.isMutating,
      createSubscription,
      isCreatingSubscription: meta.isMutating,
      cancelSubscription,
      isCancelingSubscription: meta.isMutating,
    }),
    [
      cancelSubscription,
      createSubscription,
      enabled,
      meta.error,
      meta.isFirstPayment,
      meta.isLoading,
      meta.isMutating,
      refetch,
      startTrial,
      subscription,
    ],
  );
}
