"use client";

import {
  useDomainBootstrap,
  useDomainBootstrapBridge,
} from "@/hooks/shared/use-domain-bootstrap";
import { useGym } from "@/hooks/use-gym";
import { getGymBootstrapRequest } from "@/lib/api/bootstrap";
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
  return useDomainBootstrap({
    domain: "gym",
    sections,
    enabled: options?.enabled,
    queryKey: queryKeys.gymBootstrap(sections),
    queryFn: () => getGymBootstrapRequest(sections),
  });
}

export function useGymBootstrapBridge(
  sections?: readonly GymDataSection[],
  options?: {
    enabled?: boolean;
  },
) {
  const { hydrateInitial } = useGym("actions");
  return useDomainBootstrapBridge({
    domain: "gym",
    sections,
    enabled: options?.enabled,
    queryKey: queryKeys.gymBootstrap(sections),
    queryFn: () => getGymBootstrapRequest(sections),
    normalizeData: (data) => normalizeGymDates(data) as Partial<GymUnifiedData>,
    hydrate: hydrateInitial,
  });
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
