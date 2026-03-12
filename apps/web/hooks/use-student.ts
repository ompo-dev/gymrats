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

import { useMemo } from "react";
import type { StudentData } from "@/lib/types/student-unified";
import { selectFromData } from "@/lib/utils/student/student-selectors";
import {
  type StudentUnifiedState,
  useStudentUnifiedStore,
} from "@/stores/student-unified-store";

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
  | "weeklyPlan"
  | "weeklyPlan"
  | "libraryPlans"
  | "workoutHistory"
  | "personalRecords"
  | "activeNutritionPlan"
  | "nutritionLibraryPlans"
  | "dailyNutrition"
  | "foodDatabase"
  | "subscription"
  | "memberships"
  | "payments"
  | "paymentMethods"
  | "referral"
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
        : Record<string, unknown> {
  // Usar seletores do Zustand para reatividade correta
  const data = useStudentUnifiedStore((state) => state.data);
  // Seletor específico para dailyNutrition para garantir reatividade
  const dailyNutritionData = useStudentUnifiedStore(
    (state) => state.data.dailyNutrition,
  );
  // Seletor específico para units para garantir reatividade imediata
  const unitsData = useStudentUnifiedStore((state) => state.data.units);
  // Seletor específico para weeklyPlan para garantir reatividade após loadWeeklyPlan
  const weeklyPlanData = useStudentUnifiedStore(
    (state) => state.data.weeklyPlan,
  );
  const loadAll = useStudentUnifiedStore((state) => state.loadAll);
  const loadAllPrioritized = useStudentUnifiedStore(
    (state) => state.loadAllPrioritized,
  );
  const createWeeklyPlan = useStudentUnifiedStore(
    (state) => state.createWeeklyPlan,
  );
  const updateWeeklyPlan = useStudentUnifiedStore(
    (state) => state.updateWeeklyPlan,
  );
  const resetWeeklyPlan = useStudentUnifiedStore(
    (state) => state.resetWeeklyPlan,
  );
  const addWeeklyPlanWorkout = useStudentUnifiedStore(
    (state) => state.addWeeklyPlanWorkout,
  );

  // Extrair actions usando seletores para garantir reatividade
  const updateProgress = useStudentUnifiedStore(
    (state) => state.updateProgress,
  );
  const updateProfile = useStudentUnifiedStore((state) => state.updateProfile);
  const addWeight = useStudentUnifiedStore((state) => state.addWeight);
  const completeWorkout = useStudentUnifiedStore(
    (state) => state.completeWorkout,
  );
  const addPersonalRecord = useStudentUnifiedStore(
    (state) => state.addPersonalRecord,
  );
  const updateNutrition = useStudentUnifiedStore(
    (state) => state.updateNutrition,
  );
  const createNutritionLibraryPlan = useStudentUnifiedStore(
    (state) => state.createNutritionLibraryPlan,
  );
  const updateNutritionLibraryPlan = useStudentUnifiedStore(
    (state) => state.updateNutritionLibraryPlan,
  );
  const deleteNutritionLibraryPlan = useStudentUnifiedStore(
    (state) => state.deleteNutritionLibraryPlan,
  );
  const activateNutritionLibraryPlan = useStudentUnifiedStore(
    (state) => state.activateNutritionLibraryPlan,
  );
  const updateSubscription = useStudentUnifiedStore(
    (state) => state.updateSubscription,
  );
  const updateReferralPixKey = useStudentUnifiedStore(
    (state) => state.updateReferralPixKey,
  );
  const requestReferralWithdraw = useStudentUnifiedStore(
    (state) => state.requestReferralWithdraw,
  );
  const addDayPass = useStudentUnifiedStore((state) => state.addDayPass);
  const joinGym = useStudentUnifiedStore((state) => state.joinGym);
  const loadGymPlans = useStudentUnifiedStore((state) => state.loadGymPlans);
  const changeMembershipPlan = useStudentUnifiedStore(
    (state) => state.changeMembershipPlan,
  );
  const cancelMembership = useStudentUnifiedStore(
    (state) => state.cancelMembership,
  );
  const cancelPersonalAssignment = useStudentUnifiedStore(
    (state) => state.cancelPersonalAssignment,
  );
  const subscribeToPersonal = useStudentUnifiedStore(
    (state) => state.subscribeToPersonal,
  );
  const payStudentPayment = useStudentUnifiedStore(
    (state) => state.payStudentPayment,
  );
  const cancelStudentPayment = useStudentUnifiedStore(
    (state) => state.cancelStudentPayment,
  );
  const getStudentPaymentStatus = useStudentUnifiedStore(
    (state) => state.getStudentPaymentStatus,
  );
  const getPersonalPaymentStatus = useStudentUnifiedStore(
    (state) => state.getPersonalPaymentStatus,
  );
  const applyReferralToSubscription = useStudentUnifiedStore(
    (state) => state.applyReferralToSubscription,
  );

  // Workout Management Actions
  const createLibraryPlan = useStudentUnifiedStore(
    (state) => state.createLibraryPlan,
  );
  const updateLibraryPlan = useStudentUnifiedStore(
    (state) => state.updateLibraryPlan,
  );
  const deleteLibraryPlan = useStudentUnifiedStore(
    (state) => state.deleteLibraryPlan,
  );
  const activateLibraryPlan = useStudentUnifiedStore(
    (state) => state.activateLibraryPlan,
  );

  const createUnit = useStudentUnifiedStore((state) => state.createUnit);
  const updateUnit = useStudentUnifiedStore((state) => state.updateUnit);
  const deleteUnit = useStudentUnifiedStore((state) => state.deleteUnit);
  const createWorkout = useStudentUnifiedStore((state) => state.createWorkout);
  const updateWorkout = useStudentUnifiedStore((state) => state.updateWorkout);
  const deleteWorkout = useStudentUnifiedStore((state) => state.deleteWorkout);
  const addWorkoutExercise = useStudentUnifiedStore(
    (state) => state.addWorkoutExercise,
  );
  const updateWorkoutExercise = useStudentUnifiedStore(
    (state) => state.updateWorkoutExercise,
  );
  const deleteWorkoutExercise = useStudentUnifiedStore(
    (state) => state.deleteWorkoutExercise,
  );

  const setActiveWorkout = useStudentUnifiedStore(
    (state) => state.setActiveWorkout,
  );
  const updateActiveWorkout = useStudentUnifiedStore(
    (state) => state.updateActiveWorkout,
  );
  const saveWorkoutProgress = useStudentUnifiedStore(
    (state) => state.saveWorkoutProgress,
  );
  const clearActiveWorkout = useStudentUnifiedStore(
    (state) => state.clearActiveWorkout,
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
    (state) => state.loadWeightHistory,
  );
  const loadWorkouts = useStudentUnifiedStore((state) => state.loadWorkouts);
  const loadWeeklyPlan = useStudentUnifiedStore(
    (state) => state.loadWeeklyPlan,
  );
  const loadActiveNutritionPlan = useStudentUnifiedStore(
    (state) => state.loadActiveNutritionPlan,
  );
  const loadNutritionLibraryPlans = useStudentUnifiedStore(
    (state) => state.loadNutritionLibraryPlans,
  );
  const loadLibraryPlans = useStudentUnifiedStore(
    (state) => state.loadLibraryPlans,
  );
  const loadWorkoutHistory = useStudentUnifiedStore(
    (state) => state.loadWorkoutHistory,
  );
  const loadPersonalRecords = useStudentUnifiedStore(
    (state) => state.loadPersonalRecords,
  );
  const loadNutrition = useStudentUnifiedStore((state) => state.loadNutrition);
  const loadSubscription = useStudentUnifiedStore(
    (state) => state.loadSubscription,
  );
  const loadMemberships = useStudentUnifiedStore(
    (state) => state.loadMemberships,
  );
  const loadPayments = useStudentUnifiedStore((state) => state.loadPayments);
  const loadPaymentMethods = useStudentUnifiedStore(
    (state) => state.loadPaymentMethods,
  );
  const loadReferral = useStudentUnifiedStore((state) => state.loadReferral);
  const loadDayPasses = useStudentUnifiedStore((state) => state.loadDayPasses);
  const loadFriends = useStudentUnifiedStore((state) => state.loadFriends);
  const loadGymLocations = useStudentUnifiedStore(
    (state) => state.loadGymLocations,
  );
  const loadGymLocationsWithPosition = useStudentUnifiedStore(
    (state) => state.loadGymLocationsWithPosition,
  );
  const loadFoodDatabase = useStudentUnifiedStore(
    (state) => state.loadFoodDatabase,
  );

  const actionsValue = useMemo(
    () =>
      getActions({
        updateProgress,
        updateProfile,
        addWeight,
        completeWorkout,
        addPersonalRecord,
        updateNutrition,
        createNutritionLibraryPlan,
        updateNutritionLibraryPlan,
        deleteNutritionLibraryPlan,
        activateNutritionLibraryPlan,
        updateSubscription,
        updateReferralPixKey,
        requestReferralWithdraw,
        addDayPass,
        joinGym,
        loadGymPlans,
        changeMembershipPlan,
        cancelMembership,
        cancelPersonalAssignment,
        subscribeToPersonal,
        payStudentPayment,
        cancelStudentPayment,
        getStudentPaymentStatus,
        getPersonalPaymentStatus,
        applyReferralToSubscription,
        createWeeklyPlan,
        updateWeeklyPlan,
        resetWeeklyPlan,
        addWeeklyPlanWorkout,
        createLibraryPlan,
        updateLibraryPlan,
        deleteLibraryPlan,
        activateLibraryPlan,
        createUnit,
        updateUnit,
        deleteUnit,
        createWorkout,
        updateWorkout,
        deleteWorkout,
        addWorkoutExercise,
        updateWorkoutExercise,
        deleteWorkoutExercise,
        setActiveWorkout,
        updateActiveWorkout,
        saveWorkoutProgress,
        clearActiveWorkout,
        syncAll,
        syncProgress,
        syncNutrition,
        reset,
        clearCache,
      }),
    [
      updateProgress,
      updateProfile,
      addWeight,
      completeWorkout,
      addPersonalRecord,
      updateNutrition,
      createNutritionLibraryPlan,
      updateNutritionLibraryPlan,
      deleteNutritionLibraryPlan,
      activateNutritionLibraryPlan,
      updateSubscription,
      updateReferralPixKey,
      requestReferralWithdraw,
      addDayPass,
      joinGym,
      loadGymPlans,
      changeMembershipPlan,
      cancelMembership,
      cancelPersonalAssignment,
      subscribeToPersonal,
      payStudentPayment,
      cancelStudentPayment,
      getStudentPaymentStatus,
      getPersonalPaymentStatus,
      applyReferralToSubscription,
      createWeeklyPlan,
      updateWeeklyPlan,
      resetWeeklyPlan,
      addWeeklyPlanWorkout,
      createLibraryPlan,
      updateLibraryPlan,
      deleteLibraryPlan,
      activateLibraryPlan,
      createUnit,
      updateUnit,
      deleteUnit,
      createWorkout,
      updateWorkout,
      deleteWorkout,
      addWorkoutExercise,
      updateWorkoutExercise,
      deleteWorkoutExercise,
      setActiveWorkout,
      updateActiveWorkout,
      saveWorkoutProgress,
      clearActiveWorkout,
      syncAll,
      syncProgress,
      syncNutrition,
      reset,
      clearCache,
    ],
  );

  const loadersValue = useMemo(
    () =>
      getLoaders({
        loadAll,
        loadAllPrioritized,
        loadUser,
        loadProgress,
        loadProfile,
        loadWeightHistory,
        loadWorkouts,
        loadWeeklyPlan,
        loadActiveNutritionPlan,
        loadNutritionLibraryPlans,
        loadLibraryPlans,
        loadWorkoutHistory,
        loadPersonalRecords,
        loadNutrition,
        loadSubscription,
        loadMemberships,
        loadPayments,
        loadPaymentMethods,
        loadReferral,
        loadDayPasses,
        loadFriends,
        loadGymLocations,
        loadGymLocationsWithPosition,
        loadFoodDatabase,
      }),
    [
      loadAll,
      loadAllPrioritized,
      loadUser,
      loadProgress,
      loadProfile,
      loadWeightHistory,
      loadWorkouts,
      loadWeeklyPlan,
      loadActiveNutritionPlan,
      loadNutritionLibraryPlans,
      loadLibraryPlans,
      loadWorkoutHistory,
      loadPersonalRecords,
      loadNutrition,
      loadSubscription,
      loadMemberships,
      loadPayments,
      loadPaymentMethods,
      loadReferral,
      loadDayPasses,
      loadFriends,
      loadGymLocations,
      loadGymLocationsWithPosition,
      loadFoodDatabase,
    ],
  );

  // NOTA: O carregamento automático foi movido para useStudentInitializer
  // para centralizar a lógica de inicialização. Use useStudentInitializer
  // em layouts ou providers para carregar dados automaticamente.

  //  nhum seletor, retorna tudo
  if (selectors.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data as any;
  }

  // Se apenas um seletor
  if (selectors.length === 1) {
    const selector = selectors[0];

    // Se for 'actions', retorna actions
    if (selector === "actions") {
      return actionsValue as any;
    }

    // Se for 'loaders', retorna loaders
    if (selector === "loaders") {
      return loadersValue as any;
    }

    // Caso contrário, retorna o dado selecionado
    // Para dailyNutrition, usar valor já selecionado para garantir reatividade
    if (selector === "dailyNutrition") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return dailyNutritionData as any;
    }
    // Para units, usar valor já selecionado para garantir reatividade imediata
    if (selector === "units") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return unitsData as any;
    }
    // Para weeklyPlan, usar valor já selecionado para garantir reatividade após loadWeeklyPlan
    if (selector === "weeklyPlan") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return weeklyPlanData as any;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return selectFromData(data, selector) as any;
  }

  // Múltiplos seletores
  const result: Record<string, unknown> = {};

  selectors.forEach((selector) => {
    if (selector === "actions") {
      result.actions = actionsValue;
    } else if (selector === "loaders") {
      result.loaders = loadersValue;
    } else if (selector === "dailyNutrition") {
      // Usar valor já selecionado para garantir reatividade
      result[selector] = dailyNutritionData;
    } else if (selector === "units") {
      // Usar valor já selecionado para garantir reatividade imediata
      result[selector] = unitsData;
    } else if (selector === "weeklyPlan") {
      // Usar valor já selecionado para garantir reatividade após loadWeeklyPlan
      result[selector] = weeklyPlanData;
    } else {
      result[selector] = selectFromData(data, selector);
    }
  });

  // Tipo dinâmico baseado nos seletores - overloads garantem tipo correto no uso
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  createNutritionLibraryPlan: StudentUnifiedState["createNutritionLibraryPlan"];
  updateNutritionLibraryPlan: StudentUnifiedState["updateNutritionLibraryPlan"];
  deleteNutritionLibraryPlan: StudentUnifiedState["deleteNutritionLibraryPlan"];
  activateNutritionLibraryPlan: StudentUnifiedState["activateNutritionLibraryPlan"];
  updateSubscription: StudentUnifiedState["updateSubscription"];
  updateReferralPixKey: StudentUnifiedState["updateReferralPixKey"];
  requestReferralWithdraw: StudentUnifiedState["requestReferralWithdraw"];
  addDayPass: StudentUnifiedState["addDayPass"];
  joinGym: StudentUnifiedState["joinGym"];
  loadGymPlans: StudentUnifiedState["loadGymPlans"];
  changeMembershipPlan: StudentUnifiedState["changeMembershipPlan"];
  cancelMembership: StudentUnifiedState["cancelMembership"];
  cancelPersonalAssignment: StudentUnifiedState["cancelPersonalAssignment"];
  subscribeToPersonal: StudentUnifiedState["subscribeToPersonal"];
  payStudentPayment: StudentUnifiedState["payStudentPayment"];
  cancelStudentPayment: StudentUnifiedState["cancelStudentPayment"];
  getStudentPaymentStatus: StudentUnifiedState["getStudentPaymentStatus"];
  getPersonalPaymentStatus: StudentUnifiedState["getPersonalPaymentStatus"];
  applyReferralToSubscription: StudentUnifiedState["applyReferralToSubscription"];
  createWeeklyPlan: StudentUnifiedState["createWeeklyPlan"];
  updateWeeklyPlan: StudentUnifiedState["updateWeeklyPlan"];
  resetWeeklyPlan: StudentUnifiedState["resetWeeklyPlan"];
  addWeeklyPlanWorkout: StudentUnifiedState["addWeeklyPlanWorkout"];
  createLibraryPlan: StudentUnifiedState["createLibraryPlan"];
  updateLibraryPlan: StudentUnifiedState["updateLibraryPlan"];
  deleteLibraryPlan: StudentUnifiedState["deleteLibraryPlan"];
  activateLibraryPlan: StudentUnifiedState["activateLibraryPlan"];
  createUnit: StudentUnifiedState["createUnit"];
  updateUnit: StudentUnifiedState["updateUnit"];
  deleteUnit: StudentUnifiedState["deleteUnit"];
  createWorkout: StudentUnifiedState["createWorkout"];
  updateWorkout: StudentUnifiedState["updateWorkout"];
  deleteWorkout: StudentUnifiedState["deleteWorkout"];
  addWorkoutExercise: StudentUnifiedState["addWorkoutExercise"];
  updateWorkoutExercise: StudentUnifiedState["updateWorkoutExercise"];
  deleteWorkoutExercise: StudentUnifiedState["deleteWorkoutExercise"];
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
    createNutritionLibraryPlan: actions.createNutritionLibraryPlan,
    updateNutritionLibraryPlan: actions.updateNutritionLibraryPlan,
    deleteNutritionLibraryPlan: actions.deleteNutritionLibraryPlan,
    activateNutritionLibraryPlan: actions.activateNutritionLibraryPlan,
    updateSubscription: actions.updateSubscription,
    updateReferralPixKey: actions.updateReferralPixKey,
    requestReferralWithdraw: actions.requestReferralWithdraw,
    addDayPass: actions.addDayPass,
    joinGym: actions.joinGym,
    loadGymPlans: actions.loadGymPlans,
    changeMembershipPlan: actions.changeMembershipPlan,
    cancelMembership: actions.cancelMembership,
    cancelPersonalAssignment: actions.cancelPersonalAssignment,
    subscribeToPersonal: actions.subscribeToPersonal,
    payStudentPayment: actions.payStudentPayment,
    cancelStudentPayment: actions.cancelStudentPayment,
    getStudentPaymentStatus: actions.getStudentPaymentStatus,
    getPersonalPaymentStatus: actions.getPersonalPaymentStatus,
    applyReferralToSubscription: actions.applyReferralToSubscription,
    createWeeklyPlan: actions.createWeeklyPlan,
    updateWeeklyPlan: actions.updateWeeklyPlan,
    resetWeeklyPlan: actions.resetWeeklyPlan,
    addWeeklyPlanWorkout: actions.addWeeklyPlanWorkout,
    createLibraryPlan: actions.createLibraryPlan,
    updateLibraryPlan: actions.updateLibraryPlan,
    deleteLibraryPlan: actions.deleteLibraryPlan,
    activateLibraryPlan: actions.activateLibraryPlan,
    createUnit: actions.createUnit,
    updateUnit: actions.updateUnit,
    deleteUnit: actions.deleteUnit,
    createWorkout: actions.createWorkout,
    updateWorkout: actions.updateWorkout,
    deleteWorkout: actions.deleteWorkout,
    addWorkoutExercise: actions.addWorkoutExercise,
    updateWorkoutExercise: actions.updateWorkoutExercise,
    deleteWorkoutExercise: actions.deleteWorkoutExercise,
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
  loadWeeklyPlan: StudentUnifiedState["loadWeeklyPlan"];
  loadActiveNutritionPlan: StudentUnifiedState["loadActiveNutritionPlan"];
  loadNutritionLibraryPlans: StudentUnifiedState["loadNutritionLibraryPlans"];
  loadLibraryPlans: StudentUnifiedState["loadLibraryPlans"];
  loadWorkoutHistory: StudentUnifiedState["loadWorkoutHistory"];
  loadPersonalRecords: StudentUnifiedState["loadPersonalRecords"];
  loadNutrition: StudentUnifiedState["loadNutrition"];
  loadSubscription: StudentUnifiedState["loadSubscription"];
  loadMemberships: StudentUnifiedState["loadMemberships"];
  loadPayments: StudentUnifiedState["loadPayments"];
  loadPaymentMethods: StudentUnifiedState["loadPaymentMethods"];
  loadReferral: StudentUnifiedState["loadReferral"];
  loadDayPasses: StudentUnifiedState["loadDayPasses"];
  loadFriends: StudentUnifiedState["loadFriends"];
  loadGymLocations: StudentUnifiedState["loadGymLocations"];
  loadGymLocationsWithPosition: StudentUnifiedState["loadGymLocationsWithPosition"];
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
    loadWeeklyPlan: actions.loadWeeklyPlan,
    loadActiveNutritionPlan: actions.loadActiveNutritionPlan,
    loadNutritionLibraryPlans: actions.loadNutritionLibraryPlans,
    loadLibraryPlans: actions.loadLibraryPlans,
    loadWorkoutHistory: actions.loadWorkoutHistory,
    loadPersonalRecords: actions.loadPersonalRecords,
    loadNutrition: actions.loadNutrition,
    loadSubscription: actions.loadSubscription,
    loadMemberships: actions.loadMemberships,
    loadPayments: actions.loadPayments,
    loadPaymentMethods: actions.loadPaymentMethods,
    loadReferral: actions.loadReferral,
    loadDayPasses: actions.loadDayPasses,
    loadFriends: actions.loadFriends,
    loadGymLocations: actions.loadGymLocations,
    loadGymLocationsWithPosition: actions.loadGymLocationsWithPosition,
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
