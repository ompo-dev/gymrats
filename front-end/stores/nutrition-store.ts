/**
 * @deprecated This store has been removed and replaced by useStudent('dailyNutrition')
 * This file exists temporarily to clear HMR cache. It will be removed after restart.
 * 
 * DO NOT USE - Use useStudent('dailyNutrition') and useStudent('actions') instead
 */

import { create } from "zustand";

interface NutritionState {
  dailyNutrition: any;
  setDailyNutrition: (nutrition: any) => void;
}

// Stub vazio apenas para limpar cache do HMR
export const useNutritionStore = create<NutritionState>(() => ({
  dailyNutrition: null,
  setDailyNutrition: () => {
    console.warn("useNutritionStore is deprecated. Use useStudent('dailyNutrition') instead.");
  },
}));

