/**
 * Slice de progresso para student-unified-store.
 */

import { loadSection } from "../load-helpers";
import type { StudentGetState, StudentSetState } from "./types";

export function createProgressSlice(
  set: StudentSetState,
  _get: StudentGetState,
) {
  return {
    loadProgress: async () => {
      const section = await loadSection("progress");
      set((state) => ({
        data: {
          ...state.data,
          progress: { ...state.data.progress, ...section.progress },
        },
      }));
    },
    loadWorkoutHistory: async () => {
      const section = await loadSection("workoutHistory");
      set((state) => ({
        data: {
          ...state.data,
          workoutHistory: section.workoutHistory || state.data.workoutHistory,
        },
      }));
    },
    loadPersonalRecords: async () => {
      const section = await loadSection("personalRecords");
      set((state) => ({
        data: {
          ...state.data,
          personalRecords:
            section.personalRecords || state.data.personalRecords,
        },
      }));
    },
    addPersonalRecord: (record: import("@/lib/types").PersonalRecord) => {
      set((state) => ({
        data: {
          ...state.data,
          personalRecords: [record, ...state.data.personalRecords],
        },
      }));
    },
  };
}
