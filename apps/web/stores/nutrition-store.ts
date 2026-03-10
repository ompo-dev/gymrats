/**
 * @deprecated This store has been removed and replaced by useStudent('dailyNutrition')
 * This file exists temporarily to clear HMR cache. It will be removed after restart.
 *
 * DO NOT USE - Use useStudent('dailyNutrition') and useStudent('actions') instead
 */

import { create } from "zustand";

import type { DailyNutrition } from "@/lib/types";

interface NutritionState {
  dailyNutrition: DailyNutrition | null;
  setDailyNutrition: (nutrition: DailyNutrition | null) => void;
}

// Stub vazio apenas para limpar cache do HMR
export const useNutritionStore = create<NutritionState>(() => ({
  dailyNutrition: null,
  setDailyNutrition: () => {
    console.warn(
      "useNutritionStore is deprecated. Use useStudent('dailyNutrition') instead.",
    );
  },
}));
