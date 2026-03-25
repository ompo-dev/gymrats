"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { useGym } from "@/hooks/use-gym";
import { getGymBootstrapRequest } from "@/lib/api/bootstrap";
import { recordClientTelemetryEvent } from "@/lib/observability/client-events";
import { queryKeys } from "@/lib/query/query-keys";
import type { GymDataSection, GymUnifiedData } from "@/lib/types/gym-unified";
import { normalizeGymDates } from "@/lib/utils/date-safe";

export const GYM_DASHBOARD_BOOTSTRAP_SECTIONS = [
  "profile",
  "stats",
  "students",
  "equipment",
  "recentCheckIns",
  "subscription",
] as const satisfies readonly GymDataSection[];

export const GYM_STUDENTS_BOOTSTRAP_SECTIONS = [
  "students",
  "membershipPlans",
] as const satisfies readonly GymDataSection[];

export const GYM_FINANCIAL_BOOTSTRAP_SECTIONS = [
  "financialSummary",
  "payments",
  "coupons",
  "campaigns",
  "membershipPlans",
  "expenses",
  "balanceWithdraws",
  "subscription",
] as const satisfies readonly GymDataSection[];

export const GYM_STATS_BOOTSTRAP_SECTIONS = [
  "stats",
  "equipment",
] as const satisfies readonly GymDataSection[];

export const GYM_SETTINGS_BOOTSTRAP_SECTIONS = [
  "profile",
  "membershipPlans",
] as const satisfies readonly GymDataSection[];

export function useGymBootstrap(
  sections?: readonly GymDataSection[],
  options?: {
    enabled?: boolean;
  },
) {
  const query = useQuery({
    queryKey: queryKeys.gymBootstrap(sections),
    queryFn: () => getGymBootstrapRequest(sections),
    enabled: options?.enabled ?? true,
    retry: false,
  });
  const lastTrackedRequestId = useRef<string | null>(null);

  useEffect(() => {
    if (
      !query.data?.meta.requestId ||
      query.data.meta.requestId === lastTrackedRequestId.current
    ) {
      return;
    }

    lastTrackedRequestId.current = query.data.meta.requestId;
    const payloadBytes = new Blob([JSON.stringify(query.data.data)]).size;

    void recordClientTelemetryEvent({
      eventType: "gym.bootstrap_loaded",
      domain: "gym",
      journey: "gym",
      metricName: "bootstrapBytes",
      metricValue: payloadBytes,
      payload: {
        requestId: query.data.meta.requestId,
        generatedAt: query.data.meta.generatedAt,
        sections: sections ?? ["all"],
        sectionTimings: query.data.meta.sectionTimings,
      },
    });
  }, [query.data, sections]);

  return query;
}

export function useGymBootstrapBridge(
  sections?: readonly GymDataSection[],
  options?: {
    enabled?: boolean;
  },
) {
  const query = useGymBootstrap(sections, options);
  const { hydrateInitial } = useGym("actions");
  const normalizedData = useMemo(
    () =>
      query.data?.data
        ? (normalizeGymDates(query.data.data) as Partial<GymUnifiedData>)
        : null,
    [query.data?.data],
  );

  useEffect(() => {
    if (!normalizedData) {
      return;
    }

    hydrateInitial(normalizedData);
  }, [hydrateInitial, normalizedData]);

  return query;
}

export function useGymDashboardBootstrapBridge(options?: {
  enabled?: boolean;
}) {
  return useGymBootstrapBridge(GYM_DASHBOARD_BOOTSTRAP_SECTIONS, options);
}

export function useGymStudentsBootstrapBridge(options?: { enabled?: boolean }) {
  return useGymBootstrapBridge(GYM_STUDENTS_BOOTSTRAP_SECTIONS, options);
}

export function useGymFinancialBootstrapBridge(options?: {
  enabled?: boolean;
}) {
  return useGymBootstrapBridge(GYM_FINANCIAL_BOOTSTRAP_SECTIONS, options);
}

export function useGymStatsBootstrapBridge(options?: { enabled?: boolean }) {
  return useGymBootstrapBridge(GYM_STATS_BOOTSTRAP_SECTIONS, options);
}

export function useGymSettingsBootstrapBridge(options?: { enabled?: boolean }) {
  return useGymBootstrapBridge(GYM_SETTINGS_BOOTSTRAP_SECTIONS, options);
}
