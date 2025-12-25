/**
 * Hook Modular para Student
 * 
 * Este hook permite acessar dados do student de forma modular e flexível.
 * 
 * Exemplos de uso:
 * - useStudent() - Retorna todos os dados
 * - useStudent('xp', 'age') - Retorna apenas xp e age
 * - useStudent('weightHistory') - Retorna histórico de peso
 * - useStudent('actions') - Retorna actions do store
 * - useStudent('loaders') - Retorna loaders do store
 */

"use client";

import { useEffect, useMemo } from "react";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";
import { selectFromData, selectMultiple } from "@/lib/utils/student-selectors";
import type { StudentData } from "@/lib/types/student-unified";

// ============================================
// TIPOS
// ============================================

type StudentSelector =
  | "user"
  | "student"
  | "progress"
  | "profile"
  | "weightHistory"
  | "weightGain"
  | "units"
  | "workoutHistory"
  | "personalRecords"
  | "dailyNutrition"
  | "foodDatabase"
  | "subscription"
  | "memberships"
  | "payments"
  | "paymentMethods"
  | "dayPasses"
  | "friends"
  | "gymLocations"
  | "activeWorkout"
  | "metadata"
  | "xp"
  | "totalXP"
  | "todayXP"
  | "currentStreak"
  | "longestStreak"
  | "currentLevel"
  | "level"
  | "xpToNextLevel"
  | "workoutsCompleted"
  | "achievements"
  | "name"
  | "email"
  | "username"
  | "memberSince"
  | "avatar"
  | "age"
  | "gender"
  | "phone"
  | "currentWeight"
  | "weight"
  | "height"
  | "fitnessLevel"
  | "goals"
  | "targetCalories"
  | "targetProtein"
  | "targetCarbs"
  | "targetFats"
  | "isAdmin"
  | "role"
  | "actions"
  | "loaders";

// ============================================
// HOOK PRINCIPAL
// ============================================

/**
 * Hook modular para acessar dados do student
 * 
 * @param selectors - Seletores para dados específicos
 * @returns Dados selecionados ou todos os dados se nenhum seletor for fornecido
 * 
 * @example
 * // Retorna todos os dados
 * const student = useStudent();
 * 
 * @example
 * // Retorna apenas XP e idade
 * const { xp, age } = useStudent('xp', 'age');
 * 
 * @example
 * // Retorna histórico de peso
 * const weightHistory = useStudent('weightHistory');
 * 
 * @example
 * // Retorna actions
 * const { addWeight, updateProgress } = useStudent('actions');
 * 
 * @example
 * // Retorna loaders
 * const { loadAll, loadProgress } = useStudent('loaders');
 */
export function useStudent<T extends StudentSelector>(
  ...selectors: T[]
): T extends "actions"
  ? ReturnType<typeof getActions>
  : T extends "loaders"
  ? ReturnType<typeof getLoaders>
  : T extends []
  ? StudentData
  : T extends [infer First]
  ? First extends StudentSelector
    ? ReturnType<typeof selectFromData>
    : never
  : Record<string, any> {
  const store = useStudentUnifiedStore();
  const { data, ...actions } = store;

  // Carregar dados na primeira vez se não estiver inicializado
  useEffect(() => {
    if (!data.metadata.isInitialized && !data.metadata.isLoading) {
      store.loadAll();
    }
  }, [data.metadata.isInitialized, data.metadata.isLoading, store]);

  // Se nenhum seletor, retorna tudo
  if (selectors.length === 0) {
    return data as any;
  }

  // Se apenas um seletor
  if (selectors.length === 1) {
    const selector = selectors[0];

    // Se for 'actions', retorna actions
    if (selector === "actions") {
      return getActions(actions) as any;
    }

    // Se for 'loaders', retorna loaders
    if (selector === "loaders") {
      return getLoaders(actions) as any;
    }

    // Caso contrário, retorna o dado selecionado
    return selectFromData(data, selector) as any;
  }

  // Múltiplos seletores
  const result: Record<string, any> = {};

  selectors.forEach((selector) => {
    if (selector === "actions") {
      result.actions = getActions(actions);
    } else if (selector === "loaders") {
      result.loaders = getLoaders(actions);
    } else {
      result[selector] = selectFromData(data, selector);
    }
  });

  return result as any;
}

// ============================================
// HELPERS INTERNOS
// ============================================

/**
 * Extrai actions do store
 */
function getActions(actions: Omit<ReturnType<typeof useStudentUnifiedStore>, "data">) {
  return {
    updateProgress: actions.updateProgress,
    updateProfile: actions.updateProfile,
    addWeight: actions.addWeight,
    completeWorkout: actions.completeWorkout,
    addPersonalRecord: actions.addPersonalRecord,
    updateNutrition: actions.updateNutrition,
    updateSubscription: actions.updateSubscription,
    addDayPass: actions.addDayPass,
    setActiveWorkout: actions.setActiveWorkout,
    updateActiveWorkout: actions.updateActiveWorkout,
    saveWorkoutProgress: actions.saveWorkoutProgress,
    clearActiveWorkout: actions.clearActiveWorkout,
    syncAll: actions.syncAll,
    syncProgress: actions.syncProgress,
    syncNutrition: actions.syncNutrition,
    reset: actions.reset,
    clearCache: actions.clearCache,
  };
}

/**
 * Extrai loaders do store
 */
function getLoaders(actions: Omit<ReturnType<typeof useStudentUnifiedStore>, "data">) {
  return {
    loadAll: actions.loadAll,
    loadUser: actions.loadUser,
    loadProgress: actions.loadProgress,
    loadProfile: actions.loadProfile,
    loadWeightHistory: actions.loadWeightHistory,
    loadWorkouts: actions.loadWorkouts,
    loadWorkoutHistory: actions.loadWorkoutHistory,
    loadPersonalRecords: actions.loadPersonalRecords,
    loadNutrition: actions.loadNutrition,
    loadSubscription: actions.loadSubscription,
    loadMemberships: actions.loadMemberships,
    loadPayments: actions.loadPayments,
    loadPaymentMethods: actions.loadPaymentMethods,
    loadDayPasses: actions.loadDayPasses,
    loadFriends: actions.loadFriends,
    loadGymLocations: actions.loadGymLocations,
  };
}

// ============================================
// HOOKS ESPECIALIZADOS (OPCIONAL)
// ============================================

/**
 * Hook para acessar apenas progress
 */
export function useStudentProgress() {
  return useStudent("progress");
}

/**
 * Hook para acessar apenas profile
 */
export function useStudentProfile() {
  return useStudent("profile");
}

/**
 * Hook para acessar apenas user info
 */
export function useStudentUser() {
  return useStudent("user");
}

/**
 * Hook para acessar apenas actions
 */
export function useStudentActions() {
  return useStudent("actions");
}

/**
 * Hook para acessar apenas loaders
 */
export function useStudentLoaders() {
  return useStudent("loaders");
}

