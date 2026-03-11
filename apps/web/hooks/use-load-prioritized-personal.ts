"use client";

import { usePathname } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { usePrioritizedResourceLoader } from "@/hooks/shared/use-prioritized-resource-loader";
import type { PersonalDataSection } from "@/lib/types/personal-unified";
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
  dashboard: ["profile", "affiliations", "students", "subscription"],
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

  usePrioritizedResourceLoader({
    context: options?.context,
    sections: options?.sections,
    onlyPriorities: options?.onlyPriorities ?? true,
    pathname,
    tab,
    contextPriorities: CONTEXT_PRIORITIES,
    detectContext: detectPersonalContext,
    loadPrioritized: loadAllPrioritized,
  });
}
