"use client";

import { create } from "zustand";
import { apiClient } from "@/lib/api/client";
import type {
  DailyNutrition,
  Meal,
  NutritionPlanData,
  WeeklyPlanData,
} from "@/lib/types";
import {
  createDailyNutritionFromPlan,
  mealsToNutritionPlanData,
  normalizeDailyNutrition,
} from "@/lib/utils/nutrition/nutrition-plan";

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
  activeNutritionPlans: Record<DetailKey, NutritionPlanData | null | undefined>;
  nutritionLibraryPlans: Record<DetailKey, NutritionPlanData[]>;
  nutritionByDate: Record<DetailKey, Record<string, DailyNutrition | null>>;
  weeklyPlanLoading: Record<DetailKey, boolean>;
  nutritionLoading: Record<DetailKey, boolean>;
  nutritionPlanLoading: Record<DetailKey, boolean>;
  nutritionLibraryLoading: Record<DetailKey, boolean>;
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
  loadActiveNutritionPlan: (
    scope: StudentDetailScope,
    studentId: string,
  ) => Promise<NutritionPlanData | null>;
  loadNutritionLibraryPlans: (
    scope: StudentDetailScope,
    studentId: string,
  ) => Promise<NutritionPlanData[]>;
  createNutritionLibraryPlan: (params: {
    scope: StudentDetailScope;
    studentId: string;
    payload: {
      title?: string;
      description?: string | null;
      meals?: Meal[];
    };
  }) => Promise<string | null>;
  updateNutritionLibraryPlan: (params: {
    scope: StudentDetailScope;
    studentId: string;
    planId: string;
    payload: {
      title?: string;
      description?: string | null;
      meals?: Meal[];
    };
  }) => Promise<void>;
  deleteNutritionLibraryPlan: (params: {
    scope: StudentDetailScope;
    studentId: string;
    planId: string;
  }) => Promise<void>;
  activateNutritionLibraryPlan: (params: {
    scope: StudentDetailScope;
    studentId: string;
    planId: string;
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

function getNutritionBase(scope: StudentDetailScope, studentId: string) {
  return `${getStudentsApiBase(scope)}/${studentId}/nutrition`;
}

function getNutritionLibraryBase(scope: StudentDetailScope, studentId: string) {
  return `${getNutritionBase(scope, studentId)}/library`;
}

function getNutritionActiveBase(scope: StudentDetailScope, studentId: string) {
  return `${getNutritionBase(scope, studentId)}/active`;
}

function getNutritionActivateBase(scope: StudentDetailScope, studentId: string) {
  return `${getNutritionBase(scope, studentId)}/activate`;
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

function toApiMeals(meals: Meal[]) {
  return meals.map((meal, index) => ({
    name: meal.name || "Refeicao",
    type: meal.type || "snack",
    calories: meal.calories || 0,
    protein: meal.protein || 0,
    carbs: meal.carbs || 0,
    fats: meal.fats || 0,
    time: meal.time || null,
    completed: meal.completed || false,
    order: index,
    foods: (meal.foods || []).map((food) => ({
      foodId: food.foodId || null,
      foodName: food.foodName || "Alimento",
      servings: food.servings || 1,
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fats: food.fats || 0,
      servingSize: food.servingSize || "100g",
    })),
  }));
}

function upsertLibraryPlan(plans: NutritionPlanData[], nextPlan: NutritionPlanData) {
  const existingIndex = plans.findIndex((plan) => plan.id === nextPlan.id);
  if (existingIndex === -1) {
    return [nextPlan, ...plans];
  }

  return plans.map((plan) => (plan.id === nextPlan.id ? nextPlan : plan));
}

export const useStudentDetailStore = create<StudentDetailState>()((set, get) => ({
  weeklyPlans: {},
  activeNutritionPlans: {},
  nutritionLibraryPlans: {},
  nutritionByDate: {},
  weeklyPlanLoading: {},
  nutritionLoading: {},
  nutritionPlanLoading: {},
  nutritionLibraryLoading: {},
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
        getNutritionBase(scope, studentId),
        { params: { date } },
      );
      const payload =
        response.data && typeof response.data === "object" && "data" in response.data
          ? (response.data.data as Partial<DailyNutrition>)
          : (response.data as Partial<DailyNutrition>);
      const nutrition = normalizeDailyNutrition(payload, getTargets(targets));

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
    const previousNutrition = get().nutritionByDate[key]?.[date] ?? null;
    const previousActivePlan = get().activeNutritionPlans[key] ?? null;
    const nextNutrition = normalizeDailyNutrition(
      {
        date,
        meals,
        waterIntake,
        sourceNutritionPlanId: previousNutrition?.sourceNutritionPlanId ?? null,
        hasActiveNutritionPlan:
          previousNutrition?.hasActiveNutritionPlan ??
          Boolean(previousActivePlan || meals.length > 0),
      },
      {
        ...getTargets(targets),
        ...previousNutrition,
      },
    );

    set((state) => ({
      nutritionByDate: {
        ...state.nutritionByDate,
        [key]: {
          ...(state.nutritionByDate[key] ?? {}),
          [date]: nextNutrition,
        },
      },
      activeNutritionPlans: {
        ...state.activeNutritionPlans,
        [key]:
          meals.length > 0
            ? mealsToNutritionPlanData({
                meals,
                basePlan: state.activeNutritionPlans[key] ?? null,
              })
            : state.activeNutritionPlans[key] ?? null,
      },
    }));

    try {
      const response = await apiClient.post<{
        data?: Partial<DailyNutrition>;
      }>(getNutritionBase(scope, studentId), {
        date,
        meals: toApiMeals(meals),
        waterIntake,
      });

      const payload = normalizeDailyNutrition(
        response.data.data ?? nextNutrition,
        nextNutrition,
      );

      set((state) => ({
        nutritionByDate: {
          ...state.nutritionByDate,
          [key]: {
            ...(state.nutritionByDate[key] ?? {}),
            [date]: payload,
          },
        },
      }));

      await get().loadActiveNutritionPlan(scope, studentId);
    } catch (error) {
      set((state) => ({
        nutritionByDate: {
          ...state.nutritionByDate,
          [key]: {
            ...(state.nutritionByDate[key] ?? {}),
            [date]: previousNutrition,
          },
        },
        activeNutritionPlans: {
          ...state.activeNutritionPlans,
          [key]: previousActivePlan,
        },
      }));
      throw error;
    }
  },

  updateTargetWater: async ({ scope, studentId, date, targetWater }) => {
    const key = createStudentDetailKey(scope, studentId);
    const normalizedTargetWater = Math.max(0, Math.round(targetWater));
    const previousNutrition = get().nutritionByDate[key]?.[date] ?? null;
    const nextNutrition = previousNutrition
      ? { ...previousNutrition, targetWater: normalizedTargetWater }
      : previousNutrition;

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
      const response = await apiClient.post<{
        data?: Partial<DailyNutrition>;
      }>(getNutritionBase(scope, studentId), {
        targetWater: normalizedTargetWater,
      });

      if (response.data.data) {
        const normalized = normalizeDailyNutrition(
          response.data.data,
          nextNutrition ?? getTargets(),
        );
        set((state) => ({
          nutritionByDate: {
            ...state.nutritionByDate,
            [key]: {
              ...(state.nutritionByDate[key] ?? {}),
              [date]: normalized,
            },
          },
        }));
      }
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

  loadActiveNutritionPlan: async (scope, studentId) => {
    const key = createStudentDetailKey(scope, studentId);
    set((state) => ({
      nutritionPlanLoading: { ...state.nutritionPlanLoading, [key]: true },
    }));

    try {
      const response = await apiClient.get<{
        data?: NutritionPlanData | null;
      }>(getNutritionActiveBase(scope, studentId));
      const plan = response.data.data ?? null;

      set((state) => ({
        activeNutritionPlans: {
          ...state.activeNutritionPlans,
          [key]: plan,
        },
      }));

      return plan;
    } catch {
      set((state) => ({
        activeNutritionPlans: {
          ...state.activeNutritionPlans,
          [key]: null,
        },
      }));
      return null;
    } finally {
      set((state) => ({
        nutritionPlanLoading: { ...state.nutritionPlanLoading, [key]: false },
      }));
    }
  },

  loadNutritionLibraryPlans: async (scope, studentId) => {
    const key = createStudentDetailKey(scope, studentId);
    set((state) => ({
      nutritionLibraryLoading: {
        ...state.nutritionLibraryLoading,
        [key]: true,
      },
    }));

    try {
      const response = await apiClient.get<{
        data?: NutritionPlanData[];
      }>(getNutritionLibraryBase(scope, studentId));
      const plans = response.data.data ?? [];

      set((state) => ({
        nutritionLibraryPlans: {
          ...state.nutritionLibraryPlans,
          [key]: plans,
        },
      }));

      return plans;
    } catch {
      set((state) => ({
        nutritionLibraryPlans: {
          ...state.nutritionLibraryPlans,
          [key]: [],
        },
      }));
      return [];
    } finally {
      set((state) => ({
        nutritionLibraryLoading: {
          ...state.nutritionLibraryLoading,
          [key]: false,
        },
      }));
    }
  },

  createNutritionLibraryPlan: async ({ scope, studentId, payload }) => {
    const key = createStudentDetailKey(scope, studentId);
    const response = await apiClient.post<{
      data?: NutritionPlanData;
    }>(getNutritionLibraryBase(scope, studentId), {
      title: payload.title,
      description: payload.description,
      ...(payload.meals && { meals: toApiMeals(payload.meals) }),
    });

    const nextPlan = response.data.data ?? null;
    if (!nextPlan) {
      await get().loadNutritionLibraryPlans(scope, studentId);
      return null;
    }

    set((state) => ({
      nutritionLibraryPlans: {
        ...state.nutritionLibraryPlans,
        [key]: upsertLibraryPlan(state.nutritionLibraryPlans[key] ?? [], nextPlan),
      },
    }));

    return nextPlan.id;
  },

  updateNutritionLibraryPlan: async ({ scope, studentId, planId, payload }) => {
    const key = createStudentDetailKey(scope, studentId);
    const previousPlans = get().nutritionLibraryPlans[key] ?? [];
    const targetPlan = previousPlans.find((plan) => plan.id === planId) ?? null;

    if (targetPlan) {
      const optimisticPlan = payload.meals
        ? mealsToNutritionPlanData({
            meals: payload.meals,
            basePlan: {
              ...targetPlan,
              title: payload.title ?? targetPlan.title,
              description: payload.description ?? targetPlan.description,
            },
          })
        : {
            ...targetPlan,
            ...(payload.title !== undefined && { title: payload.title }),
            ...(payload.description !== undefined && {
              description: payload.description,
            }),
          };

      set((state) => ({
        nutritionLibraryPlans: {
          ...state.nutritionLibraryPlans,
          [key]: upsertLibraryPlan(previousPlans, optimisticPlan),
        },
      }));
    }

    try {
      await apiClient.patch(`${getNutritionLibraryBase(scope, studentId)}/${planId}`, {
        ...(payload.title !== undefined && { title: payload.title }),
        ...(payload.description !== undefined && {
          description: payload.description,
        }),
        ...(payload.meals && { meals: toApiMeals(payload.meals) }),
      });

      await Promise.allSettled([
        get().loadNutritionLibraryPlans(scope, studentId),
        get().loadActiveNutritionPlan(scope, studentId),
      ]);
    } catch (error) {
      set((state) => ({
        nutritionLibraryPlans: {
          ...state.nutritionLibraryPlans,
          [key]: previousPlans,
        },
      }));
      throw error;
    }
  },

  deleteNutritionLibraryPlan: async ({ scope, studentId, planId }) => {
    const key = createStudentDetailKey(scope, studentId);
    const previousPlans = get().nutritionLibraryPlans[key] ?? [];

    set((state) => ({
      nutritionLibraryPlans: {
        ...state.nutritionLibraryPlans,
        [key]: previousPlans.filter((plan) => plan.id !== planId),
      },
    }));

    try {
      await apiClient.delete(`${getNutritionLibraryBase(scope, studentId)}/${planId}`);
    } catch (error) {
      set((state) => ({
        nutritionLibraryPlans: {
          ...state.nutritionLibraryPlans,
          [key]: previousPlans,
        },
      }));
      throw error;
    }
  },

  activateNutritionLibraryPlan: async ({ scope, studentId, planId }) => {
    const key = createStudentDetailKey(scope, studentId);
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentNutrition = get().nutritionByDate[key]?.[currentDate] ?? null;
    const previousActivePlan = get().activeNutritionPlans[key] ?? null;
    const previousNutrition = currentNutrition;
    const sourcePlan =
      (get().nutritionLibraryPlans[key] ?? []).find((plan) => plan.id === planId) ??
      null;

    if (sourcePlan) {
      set((state) => ({
        activeNutritionPlans: {
          ...state.activeNutritionPlans,
          [key]: sourcePlan,
        },
        nutritionByDate: {
          ...state.nutritionByDate,
          [key]: {
            ...(state.nutritionByDate[key] ?? {}),
            [currentDate]: createDailyNutritionFromPlan({
              plan: sourcePlan,
              baseNutrition: currentNutrition,
              date: currentDate,
            }),
          },
        },
      }));
    }

    try {
      const response = await apiClient.post<{
        data?: NutritionPlanData | null;
      }>(getNutritionActivateBase(scope, studentId), {
        libraryPlanId: planId,
      });

      set((state) => ({
        activeNutritionPlans: {
          ...state.activeNutritionPlans,
          [key]: response.data.data ?? state.activeNutritionPlans[key] ?? null,
        },
      }));

      await Promise.allSettled([
        get().loadActiveNutritionPlan(scope, studentId),
        get().loadNutrition(scope, studentId, currentDate),
        get().loadNutritionLibraryPlans(scope, studentId),
      ]);
    } catch (error) {
      set((state) => ({
        activeNutritionPlans: {
          ...state.activeNutritionPlans,
          [key]: previousActivePlan,
        },
        nutritionByDate: {
          ...state.nutritionByDate,
          [key]: {
            ...(state.nutritionByDate[key] ?? {}),
            [currentDate]: previousNutrition,
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
