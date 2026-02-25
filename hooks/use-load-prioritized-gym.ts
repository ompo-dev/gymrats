"use client";

import { usePathname } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useRef } from "react";
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
	financial: ["financialSummary", "payments", "expenses", "subscription"],
	stats: ["stats", "equipment", "students"],
	settings: ["profile", "membershipPlans", "subscription"],
	default: ["stats", "students", "profile"],
};

function detectGymContext(pathname: string, tab: string | null): GymContextType {
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
	const loadAllPrioritized = useGymUnifiedStore((state) => state.loadAllPrioritized);

	const hasCalledRef = useRef(false);
	const lastKeyRef = useRef("");
	const lastLoadTimeRef = useRef(0);
	const isLoadingRef = useRef(false);

	useEffect(() => {
		const context = options?.context ?? detectGymContext(pathname, tab);
		const base = options?.sections?.length
			? options.sections
			: CONTEXT_PRIORITIES[context];
		const priorities = Array.from(new Set(base));
		const key = priorities.slice().sort().join(",");
		const now = Date.now();

		if (isLoadingRef.current) return;
		if (lastKeyRef.current === key && hasCalledRef.current && now - lastLoadTimeRef.current < 5000) {
			return;
		}

		lastKeyRef.current = key;
		lastLoadTimeRef.current = now;
		hasCalledRef.current = true;
		isLoadingRef.current = true;

		loadAllPrioritized(priorities, options?.onlyPriorities ?? true)
			.catch((error) => {
				console.error("[useLoadPrioritizedGym] Erro ao carregar prioridades:", error);
			})
			.finally(() => {
				isLoadingRef.current = false;
			});
	}, [pathname, tab, options?.context, options?.sections, options?.onlyPriorities, loadAllPrioritized]);
}
