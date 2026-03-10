/**
 * Slice de perfil e peso para student-unified-store.
 */

import { apiClient } from "@/lib/api/client";
import type {
  StudentData,
  WeightHistoryItem,
} from "@/lib/types/student-unified";
import { calculateWeightGain, loadSection } from "../load-helpers";
import type { StudentGetState, StudentSetState } from "./types";

export function createProfileSlice(set: StudentSetState, get: StudentGetState) {
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
    updateProfile: async (updates: Partial<StudentData["profile"]>) => {
      const previousProfile = get().data.profile;
      set((state) => ({
        data: {
          ...state.data,
          profile: { ...state.data.profile, ...updates },
        },
      }));

      try {
        await apiClient.post("/api/students/profile", updates as any);
      } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        set((state) => ({
          data: { ...state.data, profile: previousProfile },
        }));
      }
    },
    addWeight: async (weight: number, date = new Date(), notes?: string) => {
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
        await apiClient.post("/api/students/weight", {
          weight,
          date: date.toISOString(),
          notes: notes ?? null,
        } as any);
      } catch (error) {
        console.error("Erro ao adicionar peso:", error);
        set((state) => ({
          data: {
            ...state.data,
            weightHistory: previousWeightHistory,
            profile: previousProfile,
          },
        }));
      }
    },
  };
}
