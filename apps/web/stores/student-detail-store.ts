"use client";

import { create } from "zustand";
import { apiClient } from "@/lib/api/client";
import type { DailyNutrition, Meal, WeeklyPlanData } from "@/lib/types";

export type StudentDetailScope = "gym" | "personal";

type DetailKey = `${StudentDetailScope}:${string}`;

export function createStudentDetailKey(
  scope: StudentDetailScope,
  studentId: string,
): DetailKey {
  return `${scope}:${studentId}`;
}

interface NutritionTargets {
  targetCalories?: number | null;
  targetProtein?: number | null;
  targetCarbs?: number | null;
  targetFats?: number | null;
  targetWater?: number | null;
}

interface StudentDetailState {
  weeklyPlans: Record<DetailKey, WeeklyPlanData | null | undefined>;
  nutritionByDate: Record<DetailKey, Record<string, DailyNutrition | null>>;
  weeklyPlanLoading: Record<DetailKey, boolean>;
  nutritionLoading: Record<DetailKey, boolean>;
  workoutMutationLoading: Record<DetailKey, boolean>;
  assigningPersonal: Record<string, boolean>;
  loadWeeklyPlan: (
    scope: StudentDetailScope,
    studentId: string,
  ) => Promise<WeeklyPlanData | null>;
  createWeeklyPlan: (
    scope: StudentDetailScope,
    studentId: string,
  ) => Promise<void>;
  updateWeeklyPlan: (params: {
    scope: StudentDetailScope;
    studentId: string;
    payload: { title?: string; description?: string };
  }) => Promise<void>;
  createWorkout: (params: {
    scope: StudentDetailScope;
    studentId: string;
    payload: Record<string, unknown>;
  }) => Promise<string | null>;
  updateWorkout: (params: {
    scope: StudentDetailScope;
    studentId: string;
    workoutId: string;
    payload: Record<string, unknown>;
  }) => Promise<void>;
  deleteWorkout: (params: {
    scope: StudentDetailScope;
    studentId: string;
    workoutId: string;
  }) => Promise<void>;
  addWorkoutExercise: (params: {
    scope: StudentDetailScope;
    studentId: string;
    workoutId: string;
    payload: Record<string, unknown>;
  }) => Promise<void>;
  updateWorkoutExercise: (params: {
    scope: StudentDetailScope;
    studentId: string;
    exerciseId: string;
    payload: Record<string, unknown>;
  }) => Promise<void>;
  deleteWorkoutExercise: (params: {
    scope: StudentDetailScope;
    studentId: string;
    exerciseId: string;
  }) => Promise<void>;
  loadNutrition: (
    scope: StudentDetailScope,
    studentId: string,
    date: string,
    targets?: NutritionTargets,
  ) => Promise<DailyNutrition | null>;
  saveNutrition: (params: {
    scope: StudentDetailScope;
    studentId: string;
    date: string;
    meals: Meal[];
    waterIntake: number;
    targets?: NutritionTargets;
  }) => Promise<void>;
  updateTargetWater: (params: {
    scope: StudentDetailScope;
    studentId: string;
    date: string;
    targetWater: number;
  }) => Promise<void>;
  assignPersonal: (studentId: string, personalId: string) => Promise<void>;
}

function getStudentsApiBase(scope: StudentDetailScope) {
  return scope === "personal" ? "/api/personals/students" : "/api/gym/students";
}

function getWorkoutManageBase(scope: StudentDetailScope, studentId: string) {
  return `${getStudentsApiBase(scope)}/${studentId}/workouts/manage`;
}

function getWorkoutExercisesBase(scope: StudentDetailScope, studentId: string) {
  return `${getStudentsApiBase(scope)}/${studentId}/workouts/exercises`;
}

function getTargets(targets?: NutritionTargets) {
  return {
    targetCalories: targets?.targetCalories ?? 2000,
    targetProtein: targets?.targetProtein ?? 150,
    targetCarbs: targets?.targetCarbs ?? 250,
    targetFats: targets?.targetFats ?? 65,
    targetWater: targets?.targetWater ?? 3000,
  };
}

function calculateTotalsFromCompletedMeals(meals: Meal[]) {
  const completedMeals = meals.filter((meal) => meal.completed === true);
  return {
    totalCalories: completedMeals.reduce(
      (sum, meal) => sum + (meal.calories || 0),
      0,
    ),
    totalProtein: completedMeals.reduce(
      (sum, meal) => sum + (meal.protein || 0),
      0,
    ),
    totalCarbs: completedMeals.reduce(
      (sum, meal) => sum + (meal.carbs || 0),
      0,
    ),
    totalFats: completedMeals.reduce((sum, meal) => sum + (meal.fats || 0), 0),
  };
}

function normalizeNutritionPayload(
  data: Record<string, unknown>,
  fallbackTargets?: NutritionTargets,
): DailyNutrition {
  const targets = getTargets(fallbackTargets);
  return {
    date: typeof data.date === "string" ? data.date : new Date().toISOString(),
    meals: Array.isArray(data.meals) ? (data.meals as Meal[]) : [],
    totalCalories:
      typeof data.totalCalories === "number" ? data.totalCalories : 0,
    totalProtein: typeof data.totalProtein === "number" ? data.totalProtein : 0,
    totalCarbs: typeof data.totalCarbs === "number" ? data.totalCarbs : 0,
    totalFats: typeof data.totalFats === "number" ? data.totalFats : 0,
    waterIntake: typeof data.waterIntake === "number" ? data.waterIntake : 0,
    targetCalories:
      typeof data.targetCalories === "number"
        ? data.targetCalories
        : targets.targetCalories,
    targetProtein:
      typeof data.targetProtein === "number"
        ? data.targetProtein
        : targets.targetProtein,
    targetCarbs:
      typeof data.targetCarbs === "number"
        ? data.targetCarbs
        : targets.targetCarbs,
    targetFats:
      typeof data.targetFats === "number" ? data.targetFats : targets.targetFats,
    targetWater:
      typeof data.targetWater === "number"
        ? data.targetWater
        : targets.targetWater,
  };
}

export const useStudentDetailStore = create<StudentDetailState>()((set, get) => ({
  weeklyPlans: {},
  nutritionByDate: {},
  weeklyPlanLoading: {},
  nutritionLoading: {},
  workoutMutationLoading: {},
  assigningPersonal: {},

  loadWeeklyPlan: async (scope, studentId) => {
    const key = createStudentDetailKey(scope, studentId);
    set((state) => ({
      weeklyPlanLoading: { ...state.weeklyPlanLoading, [key]: true },
    }));

    try {
      const response = await apiClient.get<{
        success?: boolean;
        weeklyPlan?: WeeklyPlanData | null;
      }>(`${getStudentsApiBase(scope)}/${studentId}/weekly-plan`);
      const weeklyPlan =
        response.data.success && response.data.weeklyPlan
          ? response.data.weeklyPlan
          : null;
      set((state) => ({
        weeklyPlans: { ...state.weeklyPlans, [key]: weeklyPlan },
      }));
      return weeklyPlan;
    } catch {
      set((state) => ({
        weeklyPlans: { ...state.weeklyPlans, [key]: null },
      }));
      return null;
    } finally {
      set((state) => ({
        weeklyPlanLoading: { ...state.weeklyPlanLoading, [key]: false },
      }));
    }
  },

  createWeeklyPlan: async (scope, studentId) => {
    await apiClient.post(`${getStudentsApiBase(scope)}/${studentId}/weekly-plan`, {});
    await get().loadWeeklyPlan(scope, studentId);
  },

  updateWeeklyPlan: async ({ scope, studentId, payload }) => {
    await apiClient.patch(`${getStudentsApiBase(scope)}/${studentId}/weekly-plan`, payload);
    await get().loadWeeklyPlan(scope, studentId);
  },

  createWorkout: async ({ scope, studentId, payload }) => {
    const key = createStudentDetailKey(scope, studentId);
    set((state) => ({
      workoutMutationLoading: { ...state.workoutMutationLoading, [key]: true },
    }));

    try {
      const response = await apiClient.post<{ data?: { id?: string } }>(
        getWorkoutManageBase(scope, studentId),
        payload,
      );
      await get().loadWeeklyPlan(scope, studentId);
      return response.data?.data?.id ?? null;
    } finally {
      set((state) => ({
        workoutMutationLoading: {
          ...state.workoutMutationLoading,
          [key]: false,
        },
      }));
    }
  },

  updateWorkout: async ({ scope, studentId, workoutId, payload }) => {
    const key = createStudentDetailKey(scope, studentId);
    set((state) => ({
      workoutMutationLoading: { ...state.workoutMutationLoading, [key]: true },
    }));

    try {
      await apiClient.put(`${getWorkoutManageBase(scope, studentId)}/${workoutId}`, payload);
      await get().loadWeeklyPlan(scope, studentId);
    } finally {
      set((state) => ({
        workoutMutationLoading: {
          ...state.workoutMutationLoading,
          [key]: false,
        },
      }));
    }
  },

  deleteWorkout: async ({ scope, studentId, workoutId }) => {
    const key = createStudentDetailKey(scope, studentId);
    set((state) => ({
      workoutMutationLoading: { ...state.workoutMutationLoading, [key]: true },
    }));

    try {
      await apiClient.delete(`${getWorkoutManageBase(scope, studentId)}/${workoutId}`);
      await get().loadWeeklyPlan(scope, studentId);
    } finally {
      set((state) => ({
        workoutMutationLoading: {
          ...state.workoutMutationLoading,
          [key]: false,
        },
      }));
    }
  },

  addWorkoutExercise: async ({ scope, studentId, workoutId, payload }) => {
    const key = createStudentDetailKey(scope, studentId);
    set((state) => ({
      workoutMutationLoading: { ...state.workoutMutationLoading, [key]: true },
    }));

    try {
      await apiClient.post(getWorkoutExercisesBase(scope, studentId), {
        workoutId,
        ...payload,
      });
      await get().loadWeeklyPlan(scope, studentId);
    } finally {
      set((state) => ({
        workoutMutationLoading: {
          ...state.workoutMutationLoading,
          [key]: false,
        },
      }));
    }
  },

  updateWorkoutExercise: async ({ scope, studentId, exerciseId, payload }) => {
    const key = createStudentDetailKey(scope, studentId);
    set((state) => ({
      workoutMutationLoading: { ...state.workoutMutationLoading, [key]: true },
    }));

    try {
      await apiClient.put(`${getWorkoutExercisesBase(scope, studentId)}/${exerciseId}`, payload);
      await get().loadWeeklyPlan(scope, studentId);
    } finally {
      set((state) => ({
        workoutMutationLoading: {
          ...state.workoutMutationLoading,
          [key]: false,
        },
      }));
    }
  },

  deleteWorkoutExercise: async ({ scope, studentId, exerciseId }) => {
    const key = createStudentDetailKey(scope, studentId);
    set((state) => ({
      workoutMutationLoading: { ...state.workoutMutationLoading, [key]: true },
    }));

    try {
      await apiClient.delete(`${getWorkoutExercisesBase(scope, studentId)}/${exerciseId}`);
      await get().loadWeeklyPlan(scope, studentId);
    } finally {
      set((state) => ({
        workoutMutationLoading: {
          ...state.workoutMutationLoading,
          [key]: false,
        },
      }));
    }
  },

  loadNutrition: async (scope, studentId, date, targets) => {
    const key = createStudentDetailKey(scope, studentId);
    set((state) => ({
      nutritionLoading: { ...state.nutritionLoading, [key]: true },
    }));

    try {
      const response = await apiClient.get<Record<string, unknown>>(
        `${getStudentsApiBase(scope)}/${studentId}/nutrition`,
        { params: { date } },
      );
      const nutrition =
        response.data.success === true
          ? normalizeNutritionPayload(response.data, targets)
          : null;

      set((state) => ({
        nutritionByDate: {
          ...state.nutritionByDate,
          [key]: {
            ...(state.nutritionByDate[key] ?? {}),
            [date]: nutrition,
          },
        },
      }));
      return nutrition;
    } catch {
      set((state) => ({
        nutritionByDate: {
          ...state.nutritionByDate,
          [key]: {
            ...(state.nutritionByDate[key] ?? {}),
            [date]: null,
          },
        },
      }));
      return null;
    } finally {
      set((state) => ({
        nutritionLoading: { ...state.nutritionLoading, [key]: false },
      }));
    }
  },

  saveNutrition: async ({ scope, studentId, date, meals, waterIntake, targets }) => {
    const key = createStudentDetailKey(scope, studentId);
    const nextNutrition: DailyNutrition = {
      date,
      meals,
      waterIntake,
      ...calculateTotalsFromCompletedMeals(meals),
      ...getTargets(targets),
    };

    const previousNutrition = get().nutritionByDate[key]?.[date] ?? null;
    set((state) => ({
      nutritionByDate: {
        ...state.nutritionByDate,
        [key]: {
          ...(state.nutritionByDate[key] ?? {}),
          [date]: nextNutrition,
        },
      },
    }));

    try {
      await apiClient.post(`${getStudentsApiBase(scope)}/${studentId}/nutrition`, {
        date,
        meals,
        waterIntake,
      });
    } catch (error) {
      set((state) => ({
        nutritionByDate: {
          ...state.nutritionByDate,
          [key]: {
            ...(state.nutritionByDate[key] ?? {}),
            [date]: previousNutrition,
          },
        },
      }));
      throw error;
    }
  },

  updateTargetWater: async ({ scope, studentId, date, targetWater }) => {
    const key = createStudentDetailKey(scope, studentId);
    const normalizedTargetWater = Math.max(0, Math.round(targetWater));
    const previousNutrition = get().nutritionByDate[key]?.[date] ?? null;

    set((state) => ({
      nutritionByDate: {
        ...state.nutritionByDate,
        [key]: {
          ...(state.nutritionByDate[key] ?? {}),
          [date]: previousNutrition
            ? { ...previousNutrition, targetWater: normalizedTargetWater }
            : previousNutrition,
        },
      },
    }));

    try {
      await apiClient.post(`${getStudentsApiBase(scope)}/${studentId}/nutrition`, {
        targetWater: normalizedTargetWater,
      });
    } catch (error) {
      set((state) => ({
        nutritionByDate: {
          ...state.nutritionByDate,
          [key]: {
            ...(state.nutritionByDate[key] ?? {}),
            [date]: previousNutrition,
          },
        },
      }));
      throw error;
    }
  },

  assignPersonal: async (studentId, personalId) => {
    set((state) => ({
      assigningPersonal: { ...state.assigningPersonal, [studentId]: true },
    }));
    try {
      await apiClient.post(`/api/gym/students/${studentId}/assign-personal`, {
        personalId,
      });
    } finally {
      set((state) => ({
        assigningPersonal: { ...state.assigningPersonal, [studentId]: false },
      }));
    }
  },
}));
