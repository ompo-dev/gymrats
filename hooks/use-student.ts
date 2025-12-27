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
import {
  useStudentUnifiedStore,
  type StudentUnifiedState,
} from "@/stores/student-unified-store";
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
  // Usar seletores do Zustand para reatividade correta
  const data = useStudentUnifiedStore((state) => state.data);
  // Seletor específico para dailyNutrition para garantir reatividade
  const dailyNutritionData = useStudentUnifiedStore(
    (state) => state.data.dailyNutrition
  );
  const loadAll = useStudentUnifiedStore((state) => state.loadAll);
  const loadAllPrioritized = useStudentUnifiedStore(
    (state) => state.loadAllPrioritized
  );

  // Extrair actions usando seletores para garantir reatividade
  const updateProgress = useStudentUnifiedStore(
    (state) => state.updateProgress
  );
  const updateProfile = useStudentUnifiedStore((state) => state.updateProfile);
  const addWeight = useStudentUnifiedStore((state) => state.addWeight);
  const completeWorkout = useStudentUnifiedStore(
    (state) => state.completeWorkout
  );
  const addPersonalRecord = useStudentUnifiedStore(
    (state) => state.addPersonalRecord
  );
  const updateNutrition = useStudentUnifiedStore(
    (state) => state.updateNutrition
  );
  const updateSubscription = useStudentUnifiedStore(
    (state) => state.updateSubscription
  );
  const addDayPass = useStudentUnifiedStore((state) => state.addDayPass);
  const setActiveWorkout = useStudentUnifiedStore(
    (state) => state.setActiveWorkout
  );
  const updateActiveWorkout = useStudentUnifiedStore(
    (state) => state.updateActiveWorkout
  );
  const saveWorkoutProgress = useStudentUnifiedStore(
    (state) => state.saveWorkoutProgress
  );
  const clearActiveWorkout = useStudentUnifiedStore(
    (state) => state.clearActiveWorkout
  );
  const syncAll = useStudentUnifiedStore((state) => state.syncAll);
  const syncProgress = useStudentUnifiedStore((state) => state.syncProgress);
  const syncNutrition = useStudentUnifiedStore((state) => state.syncNutrition);
  const reset = useStudentUnifiedStore((state) => state.reset);
  const clearCache = useStudentUnifiedStore((state) => state.clearCache);

  const loadUser = useStudentUnifiedStore((state) => state.loadUser);
  const loadProgress = useStudentUnifiedStore((state) => state.loadProgress);
  const loadProfile = useStudentUnifiedStore((state) => state.loadProfile);
  const loadWeightHistory = useStudentUnifiedStore(
    (state) => state.loadWeightHistory
  );
  const loadWorkouts = useStudentUnifiedStore((state) => state.loadWorkouts);
  const loadWorkoutHistory = useStudentUnifiedStore(
    (state) => state.loadWorkoutHistory
  );
  const loadPersonalRecords = useStudentUnifiedStore(
    (state) => state.loadPersonalRecords
  );
  const loadNutrition = useStudentUnifiedStore((state) => state.loadNutrition);
  const loadSubscription = useStudentUnifiedStore(
    (state) => state.loadSubscription
  );
  const loadMemberships = useStudentUnifiedStore(
    (state) => state.loadMemberships
  );
  const loadPayments = useStudentUnifiedStore((state) => state.loadPayments);
  const loadPaymentMethods = useStudentUnifiedStore(
    (state) => state.loadPaymentMethods
  );
  const loadDayPasses = useStudentUnifiedStore((state) => state.loadDayPasses);
  const loadFriends = useStudentUnifiedStore((state) => state.loadFriends);
  const loadGymLocations = useStudentUnifiedStore(
    (state) => state.loadGymLocations
  );
  const loadFoodDatabase = useStudentUnifiedStore(
    (state) => state.loadFoodDatabase
  );

  // NOTA: O carregamento automático foi movido para useStudentInitializer
  // para centralizar a lógica de inicialização. Use useStudentInitializer
  // em layouts ou providers para carregar dados automaticamente.

  // Se nenhum seletor, retorna tudo
  if (selectors.length === 0) {
    return data as any;
  }

  // Se apenas um seletor
  if (selectors.length === 1) {
    const selector = selectors[0];

    // Se for 'actions', retorna actions
    if (selector === "actions") {
      return getActions({
        updateProgress,
        updateProfile,
        addWeight,
        completeWorkout,
        addPersonalRecord,
        updateNutrition,
        updateSubscription,
        addDayPass,
        setActiveWorkout,
        updateActiveWorkout,
        saveWorkoutProgress,
        clearActiveWorkout,
        syncAll,
        syncProgress,
        syncNutrition,
        reset,
        clearCache,
      }) as any;
    }

    // Se for 'loaders', retorna loaders
    if (selector === "loaders") {
      return getLoaders({
        loadAll,
        loadAllPrioritized,
        loadUser,
        loadProgress,
        loadProfile,
        loadWeightHistory,
        loadWorkouts,
        loadWorkoutHistory,
        loadPersonalRecords,
        loadNutrition,
        loadSubscription,
        loadMemberships,
        loadPayments,
        loadPaymentMethods,
        loadDayPasses,
        loadFriends,
        loadGymLocations,
        loadFoodDatabase,
      }) as any;
    }

    // Caso contrário, retorna o dado selecionado
    // Para dailyNutrition, usar valor já selecionado para garantir reatividade
    if (selector === "dailyNutrition") {
      return dailyNutritionData as any;
    }
    return selectFromData(data, selector) as any;
  }

  // Múltiplos seletores
  const result: Record<string, any> = {};

  selectors.forEach((selector) => {
    if (selector === "actions") {
      result.actions = getActions({
        updateProgress,
        updateProfile,
        addWeight,
        completeWorkout,
        addPersonalRecord,
        updateNutrition,
        updateSubscription,
        addDayPass,
        setActiveWorkout,
        updateActiveWorkout,
        saveWorkoutProgress,
        clearActiveWorkout,
        syncAll,
        syncProgress,
        syncNutrition,
        reset,
        clearCache,
      });
    } else if (selector === "loaders") {
      result.loaders = getLoaders({
        loadAll,
        loadAllPrioritized,
        loadUser,
        loadProgress,
        loadProfile,
        loadWeightHistory,
        loadWorkouts,
        loadWorkoutHistory,
        loadPersonalRecords,
        loadNutrition,
        loadSubscription,
        loadMemberships,
        loadPayments,
        loadPaymentMethods,
        loadDayPasses,
        loadFriends,
        loadGymLocations,
        loadFoodDatabase,
      });
    } else if (selector === "dailyNutrition") {
      // Usar valor já selecionado para garantir reatividade
      result[selector] = dailyNutritionData;
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
function getActions(actions: {
  updateProgress: StudentUnifiedState["updateProgress"];
  updateProfile: StudentUnifiedState["updateProfile"];
  addWeight: StudentUnifiedState["addWeight"];
  completeWorkout: StudentUnifiedState["completeWorkout"];
  addPersonalRecord: StudentUnifiedState["addPersonalRecord"];
  updateNutrition: StudentUnifiedState["updateNutrition"];
  updateSubscription: StudentUnifiedState["updateSubscription"];
  addDayPass: StudentUnifiedState["addDayPass"];
  setActiveWorkout: StudentUnifiedState["setActiveWorkout"];
  updateActiveWorkout: StudentUnifiedState["updateActiveWorkout"];
  saveWorkoutProgress: StudentUnifiedState["saveWorkoutProgress"];
  clearActiveWorkout: StudentUnifiedState["clearActiveWorkout"];
  syncAll: StudentUnifiedState["syncAll"];
  syncProgress: StudentUnifiedState["syncProgress"];
  syncNutrition: StudentUnifiedState["syncNutrition"];
  reset: StudentUnifiedState["reset"];
  clearCache: StudentUnifiedState["clearCache"];
}) {
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
function getLoaders(actions: {
  loadAll: StudentUnifiedState["loadAll"];
  loadAllPrioritized: StudentUnifiedState["loadAllPrioritized"];
  loadUser: StudentUnifiedState["loadUser"];
  loadProgress: StudentUnifiedState["loadProgress"];
  loadProfile: StudentUnifiedState["loadProfile"];
  loadWeightHistory: StudentUnifiedState["loadWeightHistory"];
  loadWorkouts: StudentUnifiedState["loadWorkouts"];
  loadWorkoutHistory: StudentUnifiedState["loadWorkoutHistory"];
  loadPersonalRecords: StudentUnifiedState["loadPersonalRecords"];
  loadNutrition: StudentUnifiedState["loadNutrition"];
  loadSubscription: StudentUnifiedState["loadSubscription"];
  loadMemberships: StudentUnifiedState["loadMemberships"];
  loadPayments: StudentUnifiedState["loadPayments"];
  loadPaymentMethods: StudentUnifiedState["loadPaymentMethods"];
  loadDayPasses: StudentUnifiedState["loadDayPasses"];
  loadFriends: StudentUnifiedState["loadFriends"];
  loadGymLocations: StudentUnifiedState["loadGymLocations"];
  loadFoodDatabase: StudentUnifiedState["loadFoodDatabase"];
}) {
  return {
    loadAll: actions.loadAll,
    loadAllPrioritized: actions.loadAllPrioritized,
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
    loadFoodDatabase: actions.loadFoodDatabase,
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
