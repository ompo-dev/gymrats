"use client";

import {
  useDomainBootstrap,
  useDomainBootstrapBridge,
} from "@/hooks/shared/use-domain-bootstrap";
import { usePersonal } from "@/hooks/use-personal";
import { getPersonalBootstrapRequest } from "@/lib/api/bootstrap";
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
  return useDomainBootstrap({
    domain: "personal",
    sections,
    enabled: options?.enabled,
    queryKey: queryKeys.personalBootstrap(sections),
    queryFn: () => getPersonalBootstrapRequest(sections),
  });
}

export function usePersonalBootstrapBridge(
  sections?: readonly PersonalDataSection[],
  options?: {
    enabled?: boolean;
  },
) {
  const { hydrateInitial } = usePersonal("actions");
  return useDomainBootstrapBridge({
    domain: "personal",
    sections,
    enabled: options?.enabled,
    queryKey: queryKeys.personalBootstrap(sections),
    queryFn: () => getPersonalBootstrapRequest(sections),
    normalizeData: (data) =>
      normalizeGymDates(data) as Partial<PersonalUnifiedData>,
    hydrate: hydrateInitial,
  });
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
