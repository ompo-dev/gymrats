/**
 * Slice de perfil e peso para student-unified-store.
 */

import { getAuthToken } from "@/lib/auth/token-client";
import { generateIdempotencyKey, syncManager } from "@/lib/offline/sync-manager";
import { calculateWeightGain } from "../load-helpers";
import { loadSection } from "../load-helpers";
import type {
	StudentData,
	WeightHistoryItem,
} from "@/lib/types/student-unified";
import type { StudentGetState, StudentSetState } from "./types";

export function createProfileSlice(
	set: StudentSetState,
	get: StudentGetState,
) {
	return {
		loadProfile: async () => {
			const section = await loadSection("profile");
			set((state) => ({
				data: {
					...state.data,
					profile: { ...state.data.profile, ...section.profile },
				},
			}));
		},
		loadWeightHistory: async () => {
			const section = await loadSection("weightHistory");
			const newWeightHistory = section.weightHistory || [];

			set((state) => {
				const weightGain = calculateWeightGain(
					newWeightHistory.length > 0
						? newWeightHistory
						: state.data.weightHistory,
				);
				const currentWeight =
					newWeightHistory.length > 0
						? newWeightHistory[0].weight
						: state.data.profile?.weight;

				return {
					data: {
						...state.data,
						weightHistory:
							newWeightHistory.length > 0
								? newWeightHistory
								: state.data.weightHistory,
						weightGain: weightGain ?? state.data.weightGain,
						profile: {
							...state.data.profile,
							weight: currentWeight ?? state.data.profile?.weight,
						},
					},
				};
			});
		},
		updateProfile: async (
			updates: Partial<StudentData["profile"]>,
		) => {
			const previousProfile = get().data.profile;
			set((state) => ({
				data: {
					...state.data,
					profile: { ...state.data.profile, ...updates },
				},
			}));

			try {
				const token =
					typeof window !== "undefined" ? getAuthToken() : null;
				const idempotencyKey = generateIdempotencyKey();
				const result = await syncManager({
					url: "/api/students/profile",
					method: "POST",
					body: updates,
					headers: token ? { Authorization: `Bearer ${token}` } : {},
					priority: "normal",
					idempotencyKey,
				});

				if (!result.success && result.error) throw result.error;
				if (result.queued) return;
			} catch (error) {
				const err = error as { code?: string; message?: string };
				const isNetworkError =
					err?.code === "ECONNABORTED" ||
					err?.message?.includes("Network Error") ||
					!navigator.onLine;

				if (!isNetworkError) {
					console.error("Erro ao atualizar perfil:", error);
					set((state) => ({
						data: { ...state.data, profile: previousProfile },
					}));
				}
			}
		},
		addWeight: async (
			weight: number,
			date = new Date(),
			notes?: string,
		) => {
			const newEntry: WeightHistoryItem = { date, weight, notes };
			const previousWeightHistory = get().data.weightHistory;
			const previousProfile = get().data.profile;
			const newWeightHistory = [newEntry, ...get().data.weightHistory];

			set((state) => {
				const newWeightGain = calculateWeightGain(newWeightHistory);
				return {
					data: {
						...state.data,
						weightHistory: newWeightHistory,
						weightGain: newWeightGain ?? state.data.weightGain,
						profile: { ...state.data.profile, weight },
					},
				};
			});

			try {
				const token =
					typeof window !== "undefined" ? getAuthToken() : null;
				const idempotencyKey = generateIdempotencyKey();
				const result = await syncManager({
					url: "/api/students/weight",
					method: "POST",
					body: {
						weight,
						date: date.toISOString(),
						notes: notes ?? null,
					},
					headers: token ? { Authorization: `Bearer ${token}` } : {},
					priority: "high",
					idempotencyKey,
				});

				if (!result.success && result.error) throw result.error;
				if (result.queued) return;
			} catch (error) {
				const err = error as { code?: string; message?: string };
				const isNetworkError =
					err?.code === "ECONNABORTED" ||
					err?.message?.includes("Network Error") ||
					!navigator.onLine;

				if (!isNetworkError) {
					console.error("Erro ao adicionar peso:", error);
					set((state) => ({
						data: {
							...state.data,
							weightHistory: previousWeightHistory,
							profile: previousProfile,
						},
					}));
				}
			}
		},
	};
}
