"use client";

import { usePathname } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useRef } from "react";
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
  students: ["students", "affiliations"],
  gyms: ["affiliations", "students"],
  financial: ["subscription", "profile"],
  settings: ["profile", "subscription"],
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

  const hasCalledRef = useRef(false);
  const lastKeyRef = useRef("");
  const lastLoadTimeRef = useRef(0);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    const context = options?.context ?? detectPersonalContext(pathname, tab);
    const base = options?.sections?.length
      ? options.sections
      : [...CONTEXT_PRIORITIES[context]];
    const priorities = Array.from(new Set(base)) as PersonalDataSection[];
    const key = priorities.slice().sort().join(",");
    const now = Date.now();

    if (isLoadingRef.current) return;
    if (
      lastKeyRef.current === key &&
      hasCalledRef.current &&
      now - lastLoadTimeRef.current < 5000
    ) {
      return;
    }

    lastKeyRef.current = key;
    lastLoadTimeRef.current = now;
    hasCalledRef.current = true;
    isLoadingRef.current = true;

    loadAllPrioritized(priorities, options?.onlyPriorities ?? true)
      .catch((error) => {
        console.error(
          "[useLoadPrioritizedPersonal] Erro ao carregar prioridades:",
          error,
        );
      })
      .finally(() => {
        isLoadingRef.current = false;
      });
  }, [
    pathname,
    tab,
    options?.context,
    options?.sections,
    options?.onlyPriorities,
    loadAllPrioritized,
  ]);
}
