/**
 * Slice de nutricao para student-unified-store.
 */

import { actionClient as apiClient } from "@/lib/actions/client";
import type { DailyNutrition, Meal, NutritionPlanData } from "@/lib/types";
import { getBrazilNutritionDateKey } from "@/lib/utils/brazil-nutrition-date";
import {
  createDailyNutritionFromPlan,
  hasNutritionMealStructureChanged,
  mealsToNutritionPlanData,
  normalizeDailyNutrition,
} from "@/lib/utils/nutrition/nutrition-plan";
import { deduplicateMeals, loadSection } from "../load-helpers";
import type { StudentGetState, StudentSetState } from "./types";

const DAILY_NUTRITION_FLUSH_DELAY_MS = 350;
const pendingNutritionLibraryUpdates = new Map<string, Promise<void>>();
const pendingDailyNutritionSyncs = new Map<string, Promise<void>>();
const pendingDailyNutritionFlushTimers = new Map<
  string,
  ReturnType<typeof setTimeout>
>();
const pendingDailyNutritionNeedsFlush = new Set<string>();
const pendingDailyNutritionResolvers = new Map<
  string,
  Array<{
    version: number;
    resolve: () => void;
    reject: (error: unknown) => void;
  }>
>();
const latestDailyNutritionVersions = new Map<string, number>();
const latestDailyNutritionSyncPlanFlags = new Map<string, boolean>();

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

function upsertNutritionLibraryPlan(
  plans: NutritionPlanData[],
  nextPlan: NutritionPlanData,
) {
  const existingIndex = plans.findIndex((plan) => plan.id === nextPlan.id);
  if (existingIndex === -1) {
    return [nextPlan, ...plans];
  }

  return plans.map((plan) => (plan.id === nextPlan.id ? nextPlan : plan));
}

function buildDailyNutritionPayload(nutrition: DailyNutrition) {
  return {
    date: nutrition.date,
    meals: toApiMeals(nutrition.meals),
    waterIntake: nutrition.waterIntake,
    targetWater: nutrition.targetWater,
  };
}

function settleDailyNutritionResolvers(
  key: string,
  version: number,
  error?: unknown,
) {
  const resolvers = pendingDailyNutritionResolvers.get(key);
  if (!resolvers || resolvers.length === 0) {
    return;
  }

  const settledResolvers = resolvers.filter(
    (resolver) => resolver.version <= version,
  );
  const remainingResolvers = resolvers.filter(
    (resolver) => resolver.version > version,
  );

  if (remainingResolvers.length > 0) {
    pendingDailyNutritionResolvers.set(key, remainingResolvers);
  } else {
    pendingDailyNutritionResolvers.delete(key);
  }

  for (const resolver of settledResolvers) {
    if (error) {
      resolver.reject(error);
    } else {
      resolver.resolve();
    }
  }
}

function createOptimisticActivatedPlan(
  sourcePlan: NutritionPlanData,
  currentActivePlan: NutritionPlanData | null,
): NutritionPlanData {
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
  };
}

function syncLinkedActivePlan(params: {
  currentActivePlan: NutritionPlanData | null;
  updatedLibraryPlan: NutritionPlanData;
  currentNutrition: DailyNutrition;
}): {
  activeNutritionPlan: NutritionPlanData | null;
  dailyNutrition: DailyNutrition;
} {
  const { currentActivePlan, currentNutrition, updatedLibraryPlan } = params;

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
          createdById:
            currentActivePlan.createdById ?? updatedLibraryPlan.createdById,
          creatorType:
            currentActivePlan.creatorType ?? updatedLibraryPlan.creatorType,
        };

  return {
    activeNutritionPlan: nextActivePlan,
    dailyNutrition: createDailyNutritionFromPlan({
      plan: nextActivePlan,
      baseNutrition: currentNutrition,
      date: currentNutrition.date,
    }),
  };
}

export function createNutritionSlice(
  set: StudentSetState,
  get: StudentGetState,
) {
  return {
    loadNutrition: async () => {
      const [dailySection, activePlanSection] = await Promise.all([
        loadSection("dailyNutrition"),
        loadSection("activeNutritionPlan"),
      ]);

      set((state) => ({
        data: {
          ...state.data,
          dailyNutrition:
            dailySection.dailyNutrition ?? state.data.dailyNutrition,
          activeNutritionPlan:
            activePlanSection.activeNutritionPlan ??
            state.data.activeNutritionPlan,
        },
      }));
    },

    loadActiveNutritionPlan: async () => {
      const sectionData = await loadSection("activeNutritionPlan");
      set((state) => ({
        data: {
          ...state.data,
          activeNutritionPlan:
            sectionData.activeNutritionPlan ?? state.data.activeNutritionPlan,
        },
      }));
    },

    loadNutritionLibraryPlans: async () => {
      const sectionData = await loadSection("nutritionLibraryPlans");
      if (sectionData.nutritionLibraryPlans !== undefined) {
        set((state) => ({
          data: {
            ...state.data,
            nutritionLibraryPlans: sectionData.nutritionLibraryPlans!,
          },
        }));
      }
    },

    loadFoodDatabase: async () => {
      try {
        const response = await apiClient.get<{
          foods: import("@/lib/types").FoodItem[];
        }>("/api/foods/search?limit=1000", { timeout: 30000 });
        const foods = response.data.foods || [];
        set((state) => ({
          data: { ...state.data, foodDatabase: foods },
        }));
      } catch (error) {
        const err = error as {
          code?: string;
          message?: string;
          response?: { status?: number };
        };
        if (err?.code === "ECONNABORTED" || err?.message?.includes("timeout")) {
          return;
        }
        if (
          err?.response?.status === 500 ||
          err?.message?.includes("does not exist")
        ) {
          return;
        }
        console.error("Erro ao carregar alimentos:", error);
      }
    },

    updateNutrition: async (updates: Partial<DailyNutrition>) => {
      const previousNutrition = get().data.dailyNutrition;
      const resolvedDate = (() => {
        try {
          return getBrazilNutritionDateKey(
            updates.date || previousNutrition.date,
          );
        } catch {
          return getBrazilNutritionDateKey();
        }
      })();
      const isToday = resolvedDate === getBrazilNutritionDateKey();

      const nextMeals =
        updates.meals !== undefined
          ? deduplicateMeals(updates.meals)
          : previousNutrition.meals;
      const shouldSyncPlan =
        updates.meals !== undefined &&
        isToday &&
        hasNutritionMealStructureChanged(previousNutrition.meals, nextMeals);

      const nextDailyNutrition = normalizeDailyNutrition(
        {
          ...previousNutrition,
          ...updates,
          date: resolvedDate,
          meals: nextMeals,
        },
        previousNutrition,
      );

      set((state) => ({
        data: {
          ...state.data,
          dailyNutrition: nextDailyNutrition,
          activeNutritionPlan: shouldSyncPlan
            ? mealsToNutritionPlanData({
                meals: nextMeals,
                basePlan: state.data.activeNutritionPlan,
              })
            : state.data.activeNutritionPlan,
        },
      }));

      const version = (latestDailyNutritionVersions.get(resolvedDate) ?? 0) + 1;
      latestDailyNutritionVersions.set(resolvedDate, version);
      latestDailyNutritionSyncPlanFlags.set(
        resolvedDate,
        (latestDailyNutritionSyncPlanFlags.get(resolvedDate) ?? false) ||
          shouldSyncPlan,
      );

      const flushPromise = new Promise<void>((resolve, reject) => {
        const resolvers =
          pendingDailyNutritionResolvers.get(resolvedDate) ?? [];
        resolvers.push({ version, resolve, reject });
        pendingDailyNutritionResolvers.set(resolvedDate, resolvers);
      });

      const scheduleFlush = () => {
        const existingTimer =
          pendingDailyNutritionFlushTimers.get(resolvedDate);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
          pendingDailyNutritionFlushTimers.delete(resolvedDate);

          if (pendingDailyNutritionSyncs.has(resolvedDate)) {
            pendingDailyNutritionNeedsFlush.add(resolvedDate);
            return;
          }

          const flushVersion =
            latestDailyNutritionVersions.get(resolvedDate) ?? version;
          const currentNutrition = get().data.dailyNutrition;

          if (!currentNutrition || currentNutrition.date !== resolvedDate) {
            settleDailyNutritionResolvers(resolvedDate, flushVersion);
            return;
          }

          const request = apiClient
            .post<{
              data?: Partial<DailyNutrition>;
            }>("/api/nutrition/daily", {
              ...buildDailyNutritionPayload(currentNutrition),
              syncPlan:
                latestDailyNutritionSyncPlanFlags.get(resolvedDate) ?? false,
            })
            .then((response) => {
              const latestVersion =
                latestDailyNutritionVersions.get(resolvedDate) ?? flushVersion;
              const responseNutrition = normalizeDailyNutrition(
                response.data.data ?? currentNutrition,
                currentNutrition,
              );

              if (latestVersion === flushVersion) {
                set((state) => ({
                  data: {
                    ...state.data,
                    dailyNutrition: responseNutrition,
                  },
                }));
              }

              settleDailyNutritionResolvers(resolvedDate, flushVersion);
            })
            .catch((error) => {
              console.error("Erro ao atualizar nutricao:", error);
              settleDailyNutritionResolvers(resolvedDate, flushVersion, error);
            })
            .finally(() => {
              if (pendingDailyNutritionSyncs.get(resolvedDate) === request) {
                pendingDailyNutritionSyncs.delete(resolvedDate);
              }

              const latestVersion =
                latestDailyNutritionVersions.get(resolvedDate) ?? flushVersion;
              const needsAnotherFlush =
                pendingDailyNutritionNeedsFlush.has(resolvedDate) ||
                latestVersion > flushVersion;

              if (needsAnotherFlush) {
                pendingDailyNutritionNeedsFlush.delete(resolvedDate);
                scheduleFlush();
              } else {
                latestDailyNutritionSyncPlanFlags.delete(resolvedDate);
              }
            });

          pendingDailyNutritionSyncs.set(resolvedDate, request);
        }, DAILY_NUTRITION_FLUSH_DELAY_MS);

        pendingDailyNutritionFlushTimers.set(resolvedDate, timer);
      };

      if (pendingDailyNutritionSyncs.has(resolvedDate)) {
        pendingDailyNutritionNeedsFlush.add(resolvedDate);
      } else {
        scheduleFlush();
      }

      await flushPromise;
    },

    createNutritionLibraryPlan: async (data: {
      title?: string;
      description?: string | null;
      meals?: Meal[];
    }) => {
      const payload = {
        title: data.title || "Novo Plano Alimentar",
        description: data.description ?? null,
        ...(data.meals && {
          meals: toApiMeals(data.meals),
        }),
      };

      const response = await apiClient.post<{
        data?: NutritionPlanData;
      }>("/api/nutrition/library", payload);
      const nextPlan = response.data.data;

      if (nextPlan) {
        set((state) => ({
          data: {
            ...state.data,
            nutritionLibraryPlans: upsertNutritionLibraryPlan(
              state.data.nutritionLibraryPlans,
              nextPlan,
            ),
          },
        }));
        return nextPlan.id;
      }

      await get().loadNutritionLibraryPlans();
      return "";
    },

    updateNutritionLibraryPlan: async (
      planId: string,
      data: {
        title?: string;
        description?: string | null;
        meals?: Meal[];
      },
    ) => {
      const requestKey = `student:${planId}`;
      const pendingRequest = pendingNutritionLibraryUpdates.get(requestKey);
      if (pendingRequest) {
        await pendingRequest;
        return;
      }

      const previousPlans = get().data.nutritionLibraryPlans;
      const previousActiveNutritionPlan = get().data.activeNutritionPlan;
      const previousNutrition = get().data.dailyNutrition;
      const targetPlan =
        previousPlans.find((plan) => plan.id === planId) ?? null;

      if (targetPlan) {
        const nextPlan = data.meals
          ? mealsToNutritionPlanData({
              meals: data.meals,
              basePlan: {
                ...targetPlan,
                title: data.title ?? targetPlan.title,
                description: data.description ?? targetPlan.description,
              },
            })
          : {
              ...targetPlan,
              ...(data.title !== undefined && { title: data.title }),
              ...(data.description !== undefined && {
                description: data.description,
              }),
            };

        set((state) => ({
          data: {
            ...state.data,
            nutritionLibraryPlans: upsertNutritionLibraryPlan(
              state.data.nutritionLibraryPlans,
              nextPlan,
            ),
          },
        }));
      }

      const request = (async () => {
        try {
          const response = await apiClient.patch<{
            data?: NutritionPlanData;
          }>(`/api/nutrition/library/${planId}`, {
            ...(data.title !== undefined && { title: data.title }),
            ...(data.description !== undefined && {
              description: data.description,
            }),
            ...(data.meals && { meals: toApiMeals(data.meals) }),
          });

          const updatedPlan = response.data.data ?? null;
          if (updatedPlan) {
            const syncedState = syncLinkedActivePlan({
              currentActivePlan: get().data.activeNutritionPlan,
              updatedLibraryPlan: updatedPlan,
              currentNutrition: get().data.dailyNutrition,
            });

            set((state) => ({
              data: {
                ...state.data,
                nutritionLibraryPlans: upsertNutritionLibraryPlan(
                  state.data.nutritionLibraryPlans,
                  updatedPlan,
                ),
                activeNutritionPlan: syncedState.activeNutritionPlan,
                dailyNutrition: syncedState.dailyNutrition,
              },
            }));
          }
        } catch (error) {
          set((state) => ({
            data: {
              ...state.data,
              nutritionLibraryPlans: previousPlans,
              activeNutritionPlan: previousActiveNutritionPlan,
              dailyNutrition: previousNutrition,
            },
          }));
          throw error;
        } finally {
          pendingNutritionLibraryUpdates.delete(requestKey);
        }
      })();

      pendingNutritionLibraryUpdates.set(requestKey, request);
      await request;
    },

    deleteNutritionLibraryPlan: async (planId: string) => {
      const previousPlans = get().data.nutritionLibraryPlans;
      set((state) => ({
        data: {
          ...state.data,
          nutritionLibraryPlans: state.data.nutritionLibraryPlans.filter(
            (plan) => plan.id !== planId,
          ),
        },
      }));

      try {
        await apiClient.delete(`/api/nutrition/library/${planId}`);
      } catch (error) {
        set((state) => ({
          data: {
            ...state.data,
            nutritionLibraryPlans: previousPlans,
          },
        }));
        throw error;
      }
    },

    activateNutritionLibraryPlan: async (planId: string) => {
      const currentNutrition = get().data.dailyNutrition;
      const sourcePlan =
        get().data.nutritionLibraryPlans.find((plan) => plan.id === planId) ??
        null;
      const previousActiveNutritionPlan = get().data.activeNutritionPlan;
      const previousNutrition = currentNutrition;
      const optimisticActivePlan = sourcePlan
        ? createOptimisticActivatedPlan(sourcePlan, previousActiveNutritionPlan)
        : null;

      if (optimisticActivePlan) {
        set((state) => ({
          data: {
            ...state.data,
            activeNutritionPlan: optimisticActivePlan,
            dailyNutrition: createDailyNutritionFromPlan({
              plan: optimisticActivePlan,
              baseNutrition: currentNutrition,
              date: currentNutrition.date,
            }),
          },
        }));
      }

      try {
        const response = await apiClient.post<{
          data?: NutritionPlanData | null;
        }>("/api/nutrition/activate", {
          libraryPlanId: planId,
        });

        const activatedPlan = response.data.data ?? optimisticActivePlan;
        set((state) => ({
          data: {
            ...state.data,
            activeNutritionPlan: activatedPlan,
            dailyNutrition: createDailyNutritionFromPlan({
              plan: activatedPlan,
              baseNutrition: state.data.dailyNutrition,
              date: state.data.dailyNutrition.date,
            }),
          },
        }));
      } catch (error) {
        set((state) => ({
          data: {
            ...state.data,
            activeNutritionPlan: previousActiveNutritionPlan,
            dailyNutrition: previousNutrition,
          },
        }));
        throw error;
      }
    },
  };
}
