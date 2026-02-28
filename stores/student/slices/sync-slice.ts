/**
 * Slice de sincronização e reset para student-unified-store.
 */

import { initialStudentData } from "@/lib/types/student-unified";
import type { StudentGetState, StudentSetState } from "./types";

export function createSyncSlice(
	set: StudentSetState,
	get: StudentGetState,
) {
	return {
		syncAll: async () => {
			await get().loadAll();
		},
		syncProgress: async () => {
			await get().loadProgress();
		},
		syncNutrition: async () => {
			await get().loadNutrition();
		},
		syncPendingActions: async () => {
			const { pendingActions } = get().data.metadata;
			if (pendingActions.length === 0) return;
			if (typeof navigator !== "undefined" && !navigator.onLine) return;
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
			set((state) => ({
				data: {
					...state.data,
					metadata: {
						...state.data.metadata,
						pendingActions:
							state.data.metadata.pendingActions.filter(
								(action) => action.createdAt > oneHourAgo,
							),
					},
				},
			}));
		},
		reset: () => {
			set({ data: initialStudentData });
		},
		clearCache: () => {
			if (typeof localStorage !== "undefined") {
				localStorage.removeItem("student-unified-storage");
			}
			set({ data: initialStudentData });
		},
	};
}
