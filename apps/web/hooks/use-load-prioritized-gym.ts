"use client";

import { usePathname } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { usePrioritizedResourceLoader } from "@/hooks/shared/use-prioritized-resource-loader";
import type { GymDataSection } from "@/lib/types/gym-unified";
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
  dashboard: ["stats", "recentCheckIns", "students", "equipment"],
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

  usePrioritizedResourceLoader({
    context: options?.context,
    sections: options?.sections,
    onlyPriorities: options?.onlyPriorities ?? true,
    pathname,
    tab,
    contextPriorities: CONTEXT_PRIORITIES,
    detectContext: detectGymContext,
    loadPrioritized: loadAllPrioritized,
  });
}
