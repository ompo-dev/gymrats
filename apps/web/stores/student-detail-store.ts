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
  hasNutritionMealStructureChanged,
  mealsToNutritionPlanData,
  normalizeDailyNutrition,
} from "@/lib/utils/nutrition/nutrition-plan";
import { getBrazilNutritionDateKey } from "@/lib/utils/brazil-nutrition-date";

const DETAIL_DAILY_NUTRITION_FLUSH_DELAY_MS = 350;
const pendingDetailNutritionLibraryUpdates = new Map<string, Promise<void>>();
const pendingDetailDailyNutritionSyncs = new Map<string, Promise<void>>();
const pendingDetailDailyNutritionFlushTimers = new Map<
  string,
  ReturnType<typeof setTimeout>
>();
const pendingDetailDailyNutritionNeedsFlush = new Set<string>();
const pendingDetailDailyNutritionResolvers = new Map<
  string,
  Array<{
    version: number;
    resolve: () => void;
    reject: (error: unknown) => void;
  }>
>();
const latestDetailDailyNutritionVersions = new Map<string, number>();
const latestDetailDailyNutritionSyncPlanFlags = new Map<string, boolean>();

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

function createOptimisticActiveNutritionPlan(
  sourcePlan: NutritionPlanData,
  currentActivePlan: NutritionPlanData | null,
) {
  const nextPlanId =
    currentActivePlan?.sourceLibraryPlanId === sourcePlan.id
      ? currentActivePlan.id
      : currentActivePlan?.id?.startsWith("temp-active-nutrition-plan")
        ? currentActivePlan.id
        : `temp-active-nutrition-plan-${sourcePlan.id}`;

  return {
    ...sourcePlan,
    id: nextPlanId,
    isLibraryTemplate: false,
    sourceLibraryPlanId: sourcePlan.id,
  } satisfies NutritionPlanData;
}

function syncLinkedNutritionState(params: {
  currentActivePlan: NutritionPlanData | null;
  updatedLibraryPlan: NutritionPlanData;
  currentNutrition: DailyNutrition | null;
  currentDate: string;
}) {
  const {
    currentActivePlan,
    currentDate,
    currentNutrition,
    updatedLibraryPlan,
  } = params;

  if (
    !currentActivePlan ||
    (currentActivePlan.sourceLibraryPlanId !== updatedLibraryPlan.id &&
      currentActivePlan.id !== updatedLibraryPlan.id)
  ) {
    return {
      activeNutritionPlan: currentActivePlan,
      dailyNutrition: currentNutrition,
    };
  }

  const nextActivePlan =
    currentActivePlan.id === updatedLibraryPlan.id
      ? updatedLibraryPlan
      : {
          ...updatedLibraryPlan,
          id: currentActivePlan.id,
          isLibraryTemplate: false,
          sourceLibraryPlanId: updatedLibraryPlan.id,
          createdById: currentActivePlan.createdById ?? updatedLibraryPlan.createdById,
          creatorType: currentActivePlan.creatorType ?? updatedLibraryPlan.creatorType,
        };

  return {
    activeNutritionPlan: nextActivePlan,
    dailyNutrition: createDailyNutritionFromPlan({
      plan: nextActivePlan,
      baseNutrition: currentNutrition,
      date: currentDate,
    }),
  };
}

function buildDetailDailyNutritionPayload(nutrition: DailyNutrition) {
  return {
    date: nutrition.date,
    meals: toApiMeals(nutrition.meals),
    waterIntake: nutrition.waterIntake,
    targetWater: nutrition.targetWater,
  };
}

function settleDetailDailyNutritionResolvers(
  key: string,
  version: number,
  error?: unknown,
) {
  const resolvers = pendingDetailDailyNutritionResolvers.get(key);
  if (!resolvers || resolvers.length === 0) {
    return;
  }

  const settledResolvers = resolvers.filter((resolver) => resolver.version <= version);
  const remainingResolvers = resolvers.filter((resolver) => resolver.version > version);

  if (remainingResolvers.length > 0) {
    pendingDetailDailyNutritionResolvers.set(key, remainingResolvers);
  } else {
    pendingDetailDailyNutritionResolvers.delete(key);
  }

  for (const resolver of settledResolvers) {
    if (error) {
      resolver.reject(error);
    } else {
      resolver.resolve();
    }
  }
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
    const requestKey = `${key}:${date}`;
    const previousNutrition = get().nutritionByDate[key]?.[date] ?? null;
    const shouldSyncPlan =
      date === getBrazilNutritionDateKey() &&
      hasNutritionMealStructureChanged(previousNutrition?.meals ?? [], meals);
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
          shouldSyncPlan && meals.length > 0
            ? mealsToNutritionPlanData({
                meals,
                basePlan: state.activeNutritionPlans[key] ?? null,
              })
            : state.activeNutritionPlans[key] ?? null,
      },
    }));

    const version =
      (latestDetailDailyNutritionVersions.get(requestKey) ?? 0) + 1;
    latestDetailDailyNutritionVersions.set(requestKey, version);
    latestDetailDailyNutritionSyncPlanFlags.set(
      requestKey,
      (latestDetailDailyNutritionSyncPlanFlags.get(requestKey) ?? false) ||
        shouldSyncPlan,
    );

    const flushPromise = new Promise<void>((resolve, reject) => {
      const resolvers = pendingDetailDailyNutritionResolvers.get(requestKey) ?? [];
      resolvers.push({ version, resolve, reject });
      pendingDetailDailyNutritionResolvers.set(requestKey, resolvers);
    });

    const scheduleFlush = () => {
      const existingTimer = pendingDetailDailyNutritionFlushTimers.get(requestKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        pendingDetailDailyNutritionFlushTimers.delete(requestKey);

        if (pendingDetailDailyNutritionSyncs.has(requestKey)) {
          pendingDetailDailyNutritionNeedsFlush.add(requestKey);
          return;
        }

        const flushVersion =
          latestDetailDailyNutritionVersions.get(requestKey) ?? version;
        const currentNutrition = get().nutritionByDate[key]?.[date] ?? null;

        if (!currentNutrition) {
          settleDetailDailyNutritionResolvers(requestKey, flushVersion);
          return;
        }

        const request = apiClient
          .post<{
            data?: Partial<DailyNutrition>;
          }>(getNutritionBase(scope, studentId), {
            ...buildDetailDailyNutritionPayload(currentNutrition),
            syncPlan:
              latestDetailDailyNutritionSyncPlanFlags.get(requestKey) ?? false,
          })
          .then((response) => {
            const latestVersion =
              latestDetailDailyNutritionVersions.get(requestKey) ?? flushVersion;
            const payload = normalizeDailyNutrition(
              response.data.data ?? currentNutrition,
              currentNutrition,
            );

            if (latestVersion === flushVersion) {
              set((state) => ({
                nutritionByDate: {
                  ...state.nutritionByDate,
                  [key]: {
                    ...(state.nutritionByDate[key] ?? {}),
                    [date]: payload,
                  },
                },
              }));
            }

            settleDetailDailyNutritionResolvers(requestKey, flushVersion);
          })
          .catch((error) => {
            console.error("Erro ao atualizar nutricao do aluno:", error);
            settleDetailDailyNutritionResolvers(requestKey, flushVersion, error);
          })
          .finally(() => {
            if (pendingDetailDailyNutritionSyncs.get(requestKey) === request) {
              pendingDetailDailyNutritionSyncs.delete(requestKey);
            }

            const latestVersion =
              latestDetailDailyNutritionVersions.get(requestKey) ?? flushVersion;
            const needsAnotherFlush =
              pendingDetailDailyNutritionNeedsFlush.has(requestKey) ||
              latestVersion > flushVersion;

            if (needsAnotherFlush) {
              pendingDetailDailyNutritionNeedsFlush.delete(requestKey);
              scheduleFlush();
            } else {
              latestDetailDailyNutritionSyncPlanFlags.delete(requestKey);
            }
          });

        pendingDetailDailyNutritionSyncs.set(requestKey, request);
      }, DETAIL_DAILY_NUTRITION_FLUSH_DELAY_MS);

      pendingDetailDailyNutritionFlushTimers.set(requestKey, timer);
    };

    if (pendingDetailDailyNutritionSyncs.has(requestKey)) {
      pendingDetailDailyNutritionNeedsFlush.add(requestKey);
    } else {
      scheduleFlush();
    }

    await flushPromise;
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
    const requestKey = `${scope}:${studentId}:${planId}`;
    const pendingRequest =
      pendingDetailNutritionLibraryUpdates.get(requestKey);
    if (pendingRequest) {
      await pendingRequest;
      return;
    }

    const previousPlans = get().nutritionLibraryPlans[key] ?? [];
    const currentDate = getBrazilNutritionDateKey();
    const previousActivePlan = get().activeNutritionPlans[key] ?? null;
    const previousNutrition = get().nutritionByDate[key]?.[currentDate] ?? null;
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

    const request = (async () => {
      try {
        const response = await apiClient.patch<{
          data?: NutritionPlanData;
        }>(`${getNutritionLibraryBase(scope, studentId)}/${planId}`, {
          ...(payload.title !== undefined && { title: payload.title }),
          ...(payload.description !== undefined && {
            description: payload.description,
          }),
          ...(payload.meals && { meals: toApiMeals(payload.meals) }),
        });

        const updatedPlan = response.data.data ?? null;
        if (updatedPlan) {
          const syncedState = syncLinkedNutritionState({
            currentActivePlan: get().activeNutritionPlans[key] ?? null,
            updatedLibraryPlan: updatedPlan,
            currentNutrition: get().nutritionByDate[key]?.[currentDate] ?? null,
            currentDate,
          });

          set((state) => ({
            nutritionLibraryPlans: {
              ...state.nutritionLibraryPlans,
              [key]: upsertLibraryPlan(
                state.nutritionLibraryPlans[key] ?? [],
                updatedPlan,
              ),
            },
            activeNutritionPlans: {
              ...state.activeNutritionPlans,
              [key]: syncedState.activeNutritionPlan,
            },
            nutritionByDate: {
              ...state.nutritionByDate,
              [key]: {
                ...(state.nutritionByDate[key] ?? {}),
                [currentDate]: syncedState.dailyNutrition,
              },
            },
          }));
        }
      } catch (error) {
        set((state) => ({
          nutritionLibraryPlans: {
            ...state.nutritionLibraryPlans,
            [key]: previousPlans,
          },
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
      } finally {
        pendingDetailNutritionLibraryUpdates.delete(requestKey);
      }
    })();

    pendingDetailNutritionLibraryUpdates.set(requestKey, request);
    await request;
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
    const currentDate = getBrazilNutritionDateKey();
    const currentNutrition = get().nutritionByDate[key]?.[currentDate] ?? null;
    const previousActivePlan = get().activeNutritionPlans[key] ?? null;
    const previousNutrition = currentNutrition;
    const sourcePlan =
      (get().nutritionLibraryPlans[key] ?? []).find((plan) => plan.id === planId) ??
      null;
    const optimisticActivePlan = sourcePlan
      ? createOptimisticActiveNutritionPlan(sourcePlan, previousActivePlan)
      : null;

    if (optimisticActivePlan) {
      set((state) => ({
        activeNutritionPlans: {
          ...state.activeNutritionPlans,
          [key]: optimisticActivePlan,
        },
        nutritionByDate: {
          ...state.nutritionByDate,
          [key]: {
            ...(state.nutritionByDate[key] ?? {}),
            [currentDate]: createDailyNutritionFromPlan({
              plan: optimisticActivePlan,
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

      const activatedPlan = response.data.data ?? optimisticActivePlan;
      set((state) => ({
        activeNutritionPlans: {
          ...state.activeNutritionPlans,
          [key]: activatedPlan,
        },
        nutritionByDate: {
          ...state.nutritionByDate,
          [key]: {
            ...(state.nutritionByDate[key] ?? {}),
            [currentDate]: createDailyNutritionFromPlan({
              plan: activatedPlan,
              baseNutrition: state.nutritionByDate[key]?.[currentDate] ?? null,
              date: currentDate,
            }),
          },
        },
      }));
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
