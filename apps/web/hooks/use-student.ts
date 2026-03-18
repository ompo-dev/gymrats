"use client";

import { useShallow } from "zustand/react/shallow";
import type { StudentData } from "@/lib/types/student-unified";
import {
  selectFromData,
  selectMultiple,
} from "@/lib/utils/student/student-selectors";
import {
  type StudentUnifiedState,
  useStudentUnifiedStore,
} from "@/stores/student-unified-store";

type StudentSelector =
  | "user"
  | "student"
  | "progress"
  | "profile"
  | "weightHistory"
  | "weightGain"
  | "units"
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

type StudentDataSelector = Exclude<StudentSelector, "actions" | "loaders">;

function getActions(state: StudentUnifiedState) {
  return {
    updateProgress: state.updateProgress,
    updateProfile: state.updateProfile,
    addWeight: state.addWeight,
    completeWorkout: state.completeWorkout,
    addPersonalRecord: state.addPersonalRecord,
    updateNutrition: state.updateNutrition,
    createNutritionLibraryPlan: state.createNutritionLibraryPlan,
    updateNutritionLibraryPlan: state.updateNutritionLibraryPlan,
    deleteNutritionLibraryPlan: state.deleteNutritionLibraryPlan,
    activateNutritionLibraryPlan: state.activateNutritionLibraryPlan,
    updateSubscription: state.updateSubscription,
    updateReferralPixKey: state.updateReferralPixKey,
    requestReferralWithdraw: state.requestReferralWithdraw,
    addDayPass: state.addDayPass,
    joinGym: state.joinGym,
    loadGymPlans: state.loadGymPlans,
    changeMembershipPlan: state.changeMembershipPlan,
    cancelMembership: state.cancelMembership,
    cancelPersonalAssignment: state.cancelPersonalAssignment,
    subscribeToPersonal: state.subscribeToPersonal,
    payStudentPayment: state.payStudentPayment,
    cancelStudentPayment: state.cancelStudentPayment,
    getStudentPaymentStatus: state.getStudentPaymentStatus,
    getPersonalPaymentStatus: state.getPersonalPaymentStatus,
    applyReferralToSubscription: state.applyReferralToSubscription,
    createWeeklyPlan: state.createWeeklyPlan,
    updateWeeklyPlan: state.updateWeeklyPlan,
    resetWeeklyPlan: state.resetWeeklyPlan,
    addWeeklyPlanWorkout: state.addWeeklyPlanWorkout,
    createLibraryPlan: state.createLibraryPlan,
    updateLibraryPlan: state.updateLibraryPlan,
    deleteLibraryPlan: state.deleteLibraryPlan,
    activateLibraryPlan: state.activateLibraryPlan,
    createUnit: state.createUnit,
    updateUnit: state.updateUnit,
    deleteUnit: state.deleteUnit,
    createWorkout: state.createWorkout,
    updateWorkout: state.updateWorkout,
    deleteWorkout: state.deleteWorkout,
    addWorkoutExercise: state.addWorkoutExercise,
    updateWorkoutExercise: state.updateWorkoutExercise,
    deleteWorkoutExercise: state.deleteWorkoutExercise,
    setActiveWorkout: state.setActiveWorkout,
    updateActiveWorkout: state.updateActiveWorkout,
    saveWorkoutProgress: state.saveWorkoutProgress,
    clearActiveWorkout: state.clearActiveWorkout,
    syncAll: state.syncAll,
    syncProgress: state.syncProgress,
    syncNutrition: state.syncNutrition,
    reset: state.reset,
    clearCache: state.clearCache,
  };
}

function getLoaders(state: StudentUnifiedState) {
  return {
    loadAll: state.loadAll,
    loadAllPrioritized: state.loadAllPrioritized,
    loadUser: state.loadUser,
    loadProgress: state.loadProgress,
    loadProfile: state.loadProfile,
    loadWeightHistory: state.loadWeightHistory,
    loadWorkouts: state.loadWorkouts,
    loadWeeklyPlan: state.loadWeeklyPlan,
    loadActiveNutritionPlan: state.loadActiveNutritionPlan,
    loadNutritionLibraryPlans: state.loadNutritionLibraryPlans,
    loadLibraryPlans: state.loadLibraryPlans,
    loadWorkoutHistory: state.loadWorkoutHistory,
    loadPersonalRecords: state.loadPersonalRecords,
    loadNutrition: state.loadNutrition,
    loadSubscription: state.loadSubscription,
    loadMemberships: state.loadMemberships,
    loadPayments: state.loadPayments,
    loadPaymentMethods: state.loadPaymentMethods,
    loadReferral: state.loadReferral,
    loadDayPasses: state.loadDayPasses,
    loadFriends: state.loadFriends,
    loadGymLocations: state.loadGymLocations,
    loadGymLocationsWithPosition: state.loadGymLocationsWithPosition,
    loadFoodDatabase: state.loadFoodDatabase,
  };
}

export function useStudent(): StudentData;
export function useStudent(selector: "actions"): ReturnType<typeof getActions>;
export function useStudent(selector: "loaders"): ReturnType<typeof getLoaders>;
export function useStudent<S extends StudentDataSelector>(
  selector: S,
): ReturnType<typeof selectFromData>;
export function useStudent<S extends StudentSelector[]>(
  ...selectors: S
): Record<string, unknown>;
export function useStudent(...selectors: StudentSelector[]) {
  return useStudentUnifiedStore(
    useShallow((state) => {
      if (selectors.length === 0) {
        return state.data;
      }

      if (selectors.length === 1) {
        const selector = selectors[0];

        if (selector === "actions") {
          return getActions(state);
        }

        if (selector === "loaders") {
          return getLoaders(state);
        }

        return selectFromData(state.data, selector);
      }

      const result = selectMultiple(state.data, selectors);

      if (selectors.includes("actions")) {
        result.actions = getActions(state);
      }

      if (selectors.includes("loaders")) {
        result.loaders = getLoaders(state);
      }

      return result;
    }),
  );
}

export function useStudentProgress() {
  return useStudent("progress");
}

export function useStudentProfile() {
  return useStudent("profile");
}

export function useStudentUser() {
  return useStudent("user");
}

export function useStudentActions() {
  return useStudent("actions");
}

export function useStudentLoaders() {
  return useStudent("loaders");
}
