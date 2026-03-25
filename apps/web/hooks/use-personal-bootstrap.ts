"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { usePersonal } from "@/hooks/use-personal";
import { getPersonalBootstrapRequest } from "@/lib/api/bootstrap";
import { recordClientTelemetryEvent } from "@/lib/observability/client-events";
import { queryKeys } from "@/lib/query/query-keys";
import type {
  PersonalDataSection,
  PersonalUnifiedData,
} from "@/lib/types/personal-unified";
import { normalizeGymDates } from "@/lib/utils/date-safe";

export const PERSONAL_DASHBOARD_BOOTSTRAP_SECTIONS = [
  "profile",
  "affiliations",
  "students",
  "subscription",
  "financialSummary",
] as const satisfies readonly PersonalDataSection[];

export const PERSONAL_STUDENTS_BOOTSTRAP_SECTIONS = [
  "affiliations",
  "studentDirectory",
] as const satisfies readonly PersonalDataSection[];

export const PERSONAL_GYMS_BOOTSTRAP_SECTIONS = [
  "affiliations",
  "students",
] as const satisfies readonly PersonalDataSection[];

export const PERSONAL_FINANCIAL_BOOTSTRAP_SECTIONS = [
  "subscription",
  "financialSummary",
  "expenses",
  "payments",
  "coupons",
  "campaigns",
  "membershipPlans",
  "students",
  "affiliations",
] as const satisfies readonly PersonalDataSection[];

export const PERSONAL_SETTINGS_BOOTSTRAP_SECTIONS = [
  "profile",
  "membershipPlans",
  "subscription",
] as const satisfies readonly PersonalDataSection[];

export const PERSONAL_STATS_BOOTSTRAP_SECTIONS = [
  "affiliations",
  "students",
] as const satisfies readonly PersonalDataSection[];

export function usePersonalBootstrap(
  sections?: readonly PersonalDataSection[],
  options?: {
    enabled?: boolean;
  },
) {
  const query = useQuery({
    queryKey: queryKeys.personalBootstrap(sections),
    queryFn: () => getPersonalBootstrapRequest(sections),
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
      eventType: "personal.bootstrap_loaded",
      domain: "personal",
      journey: "personal",
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

export function usePersonalBootstrapBridge(
  sections?: readonly PersonalDataSection[],
  options?: {
    enabled?: boolean;
  },
) {
  const query = usePersonalBootstrap(sections, options);
  const { hydrateInitial } = usePersonal("actions");
  const normalizedData = useMemo(
    () =>
      query.data?.data
        ? (normalizeGymDates(query.data.data) as Partial<PersonalUnifiedData>)
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

export function usePersonalDashboardBootstrapBridge(options?: {
  enabled?: boolean;
}) {
  return usePersonalBootstrapBridge(
    PERSONAL_DASHBOARD_BOOTSTRAP_SECTIONS,
    options,
  );
}

export function usePersonalStudentsBootstrapBridge(options?: {
  enabled?: boolean;
}) {
  return usePersonalBootstrapBridge(
    PERSONAL_STUDENTS_BOOTSTRAP_SECTIONS,
    options,
  );
}

export function usePersonalGymsBootstrapBridge(options?: {
  enabled?: boolean;
}) {
  return usePersonalBootstrapBridge(PERSONAL_GYMS_BOOTSTRAP_SECTIONS, options);
}

export function usePersonalFinancialBootstrapBridge(options?: {
  enabled?: boolean;
}) {
  return usePersonalBootstrapBridge(
    PERSONAL_FINANCIAL_BOOTSTRAP_SECTIONS,
    options,
  );
}

export function usePersonalSettingsBootstrapBridge(options?: {
  enabled?: boolean;
}) {
  return usePersonalBootstrapBridge(
    PERSONAL_SETTINGS_BOOTSTRAP_SECTIONS,
    options,
  );
}

export function usePersonalStatsBootstrapBridge(options?: {
  enabled?: boolean;
}) {
  return usePersonalBootstrapBridge(PERSONAL_STATS_BOOTSTRAP_SECTIONS, options);
}
