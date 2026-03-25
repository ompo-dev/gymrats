"use client";

import { featureFlags } from "@gymrats/config";
import { usePathname } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback } from "react";
import { usePrioritizedResourceLoader } from "@/hooks/shared/use-prioritized-resource-loader";
import type {
  PersonalDataSection,
  PersonalUnifiedData,
} from "@/lib/types/personal-unified";
import { usePersonalUnifiedStore } from "@/stores/personal-unified-store";

type PersonalContextType =
  | "dashboard"
  | "students"
  | "gyms"
  | "financial"
  | "settings"
  | "default";

const CONTEXT_PRIORITIES: Record<
  PersonalContextType,
  readonly PersonalDataSection[]
> = {
  dashboard: [
    "profile",
    "affiliations",
    "students",
    "subscription",
    "financialSummary",
  ],
  students: ["students", "studentDirectory", "affiliations"],
  gyms: ["affiliations", "students"],
  financial: [
    "subscription",
    "financialSummary",
    "expenses",
    "payments",
    "coupons",
    "campaigns",
    "membershipPlans",
  ],
  settings: ["profile", "subscription", "membershipPlans"],
  default: ["profile", "affiliations", "students"],
};

function detectPersonalContext(
  pathname: string,
  tab: string | null,
): PersonalContextType {
  if (tab && tab in CONTEXT_PRIORITIES) {
    return tab as PersonalContextType;
  }
  if (pathname.includes("/personal")) {
    return "dashboard";
  }
  return "default";
}

function hasSectionData(
  section: PersonalDataSection,
  data: PersonalUnifiedData,
) {
  const resourceStatus = data.metadata.resources[section]?.status;
  switch (section) {
    case "profile":
      return !!data.profile || resourceStatus === "ready";
    case "affiliations":
      return data.affiliations.length > 0 || resourceStatus === "ready";
    case "students":
      return data.students.length > 0 || resourceStatus === "ready";
    case "studentDirectory":
      return data.studentDirectory.length > 0 || resourceStatus === "ready";
    case "subscription":
      return data.subscription !== null || resourceStatus === "ready";
    case "financialSummary":
      return data.financialSummary !== null || resourceStatus === "ready";
    case "expenses":
      return data.expenses.length > 0 || resourceStatus === "ready";
    case "payments":
      return data.payments.length > 0 || resourceStatus === "ready";
    case "coupons":
      return data.coupons.length > 0 || resourceStatus === "ready";
    case "campaigns":
      return data.campaigns.length > 0 || resourceStatus === "ready";
    case "membershipPlans":
      return data.membershipPlans.length > 0 || resourceStatus === "ready";
    default:
      return resourceStatus === "ready";
  }
}

export function useLoadPrioritizedPersonal(options?: {
  context?: PersonalContextType;
  sections?: PersonalDataSection[];
  onlyPriorities?: boolean;
}) {
  const pathname = usePathname();
  const [tab] = useQueryState("tab", parseAsString.withDefault("dashboard"));
  const loadAllPrioritized = usePersonalUnifiedStore(
    (state) => state.loadAllPrioritized,
  );
  const isInitialized = usePersonalUnifiedStore(
    (state) => state.data.metadata.isInitialized,
  );
  const getStoreSnapshot = useCallback(
    () => usePersonalUnifiedStore.getState().data,
    [],
  );

  usePrioritizedResourceLoader({
    context: options?.context,
    sections: options?.sections,
    onlyPriorities: options?.onlyPriorities ?? true,
    pathname,
    tab,
    contextPriorities: CONTEXT_PRIORITIES,
    detectContext: detectPersonalContext,
    loadPrioritized: loadAllPrioritized,
    getStoreSnapshot,
    hasSectionData,
    enabled: !featureFlags.perfPersonalBootstrapV2 || isInitialized,
  });
}
