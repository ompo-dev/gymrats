/**
 * Slice de sincronização e reset para student-unified-store.
 */

import { clearBootstrapHydrationState } from "@/lib/query/bootstrap-runtime";
import { initialStudentData } from "@/lib/types/student-unified";
import type { StudentGetState, StudentSetState } from "./types";

export function createSyncSlice(set: StudentSetState, get: StudentGetState) {
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
    // No-op: a fila offline foi removida — sincronização agora é 100% online.
    syncPendingActions: async () => {
      return;
    },
    reset: () => {
      clearBootstrapHydrationState("student");
      set({ data: initialStudentData });
    },
    clearCache: () => {
      clearBootstrapHydrationState("student");
      set({ data: initialStudentData });
    },
  };
}
