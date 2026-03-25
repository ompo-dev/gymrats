"use client";

import { featureFlags } from "@gymrats/config";
import { usePathname } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback } from "react";
import { usePrioritizedResourceLoader } from "@/hooks/shared/use-prioritized-resource-loader";
import type { GymDataSection, GymUnifiedData } from "@/lib/types/gym-unified";
import { useGymUnifiedStore } from "@/stores/gym-unified-store";

type GymContextType =
  | "dashboard"
  | "students"
  | "equipment"
  | "financial"
  | "stats"
  | "settings"
  | "default";

const CONTEXT_PRIORITIES: Record<GymContextType, GymDataSection[]> = {
  dashboard: [
    "profile",
    "stats",
    "students",
    "equipment",
    "recentCheckIns",
    "subscription",
  ],
  students: ["students", "membershipPlans"],
  equipment: ["equipment", "stats"],
  financial: [
    "financialSummary",
    "payments",
    "expenses",
    "coupons",
    "campaigns",
    "balanceWithdraws",
    "subscription",
    "membershipPlans",
  ],
  stats: ["stats", "equipment", "students"],
  settings: ["profile", "membershipPlans", "subscription", "coupons"],
  default: ["stats", "students", "profile"],
};

function detectGymContext(
  pathname: string,
  tab: string | null,
): GymContextType {
  if (tab && tab in CONTEXT_PRIORITIES) {
    return tab as GymContextType;
  }
  if (pathname.includes("/gym")) {
    return "dashboard";
  }
  return "default";
}

function hasSectionData(
  section: GymDataSection,
  data: GymUnifiedData,
) {
  const resourceStatus = data.metadata.resources[section]?.status;
  switch (section) {
    case "profile":
      return !!data.profile || resourceStatus === "ready";
    case "stats":
      return !!data.stats || resourceStatus === "ready";
    case "students":
      return data.students.length > 0 || resourceStatus === "ready";
    case "equipment":
      return data.equipment.length > 0 || resourceStatus === "ready";
    case "financialSummary":
      return data.financialSummary !== null || resourceStatus === "ready";
    case "recentCheckIns":
      return data.recentCheckIns.length > 0 || resourceStatus === "ready";
    case "membershipPlans":
      return data.membershipPlans.length > 0 || resourceStatus === "ready";
    case "payments":
      return data.payments.length > 0 || resourceStatus === "ready";
    case "expenses":
      return data.expenses.length > 0 || resourceStatus === "ready";
    case "coupons":
      return data.coupons.length > 0 || resourceStatus === "ready";
    case "campaigns":
      return data.campaigns.length > 0 || resourceStatus === "ready";
    case "balanceWithdraws":
      return (
        data.balanceWithdraws.withdraws.length > 0 ||
        data.balanceWithdraws.balanceCents !== 0 ||
        data.balanceWithdraws.balanceReais !== 0 ||
        resourceStatus === "ready"
      );
    case "subscription":
      return data.subscription !== null || resourceStatus === "ready";
    default:
      return resourceStatus === "ready";
  }
}

export function useLoadPrioritizedGym(options?: {
  context?: GymContextType;
  sections?: GymDataSection[];
  onlyPriorities?: boolean;
}) {
  const pathname = usePathname();
  const [tab] = useQueryState("tab", parseAsString.withDefault("dashboard"));
  const loadAllPrioritized = useGymUnifiedStore(
    (state) => state.loadAllPrioritized,
  );
  const isInitialized = useGymUnifiedStore(
    (state) => state.data.metadata.isInitialized,
  );
  const getStoreSnapshot = useCallback(() => useGymUnifiedStore.getState().data, []);

  usePrioritizedResourceLoader({
    context: options?.context,
    sections: options?.sections,
    onlyPriorities: options?.onlyPriorities ?? true,
    pathname,
    tab,
    contextPriorities: CONTEXT_PRIORITIES,
    detectContext: detectGymContext,
    loadPrioritized: loadAllPrioritized,
    getStoreSnapshot,
    hasSectionData,
    enabled: !featureFlags.perfGymBootstrapV2 || isInitialized,
  });
}
