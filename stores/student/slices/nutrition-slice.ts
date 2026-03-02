/**
 * Slice de nutrição para student-unified-store.
 */

import { apiClient } from "@/lib/api/client";
import type { DailyNutrition, Meal } from "@/lib/types";
import { getBrazilNutritionDateKey } from "@/lib/utils/brazil-nutrition-date";
import { deduplicateMeals, loadSection } from "../load-helpers";
import type { StudentGetState, StudentSetState } from "./types";

export function createNutritionSlice(
  set: StudentSetState,
  get: StudentGetState,
) {
  return {
    loadNutrition: async () => {
      const sectionData = await loadSection("dailyNutrition");
      if (sectionData?.dailyNutrition) {
        set((state) => ({
          data: {
            ...state.data,
            dailyNutrition: sectionData.dailyNutrition!,
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
          console.warn(
            "⚠️ Timeout ao carregar alimentos. Continuando com dados existentes.",
          );
          return;
        }
        if (
          err?.response?.status === 500 ||
          err?.message?.includes("does not exist")
        ) {
          console.log(
            "⚠️ Tabela de alimentos não existe. Execute: node scripts/apply-nutrition-migration.js",
          );
          return;
        }
        console.error("Erro ao carregar alimentos:", error);
      }
    },
    updateNutrition: async (updates: Partial<DailyNutrition>) => {
      const previousNutrition = get().data.dailyNutrition;
      let updatedNutrition: DailyNutrition | undefined;
      set((state) => {
        const currentNutrition = state.data.dailyNutrition;
        const updatedMeals =
          updates.meals !== undefined ? updates.meals : currentNutrition.meals;
        let calculatedTotals = {};
        if (updates.meals !== undefined) {
          const completedMeals = updatedMeals.filter(
            (meal: Meal) => meal.completed === true,
          );
          calculatedTotals = {
            totalCalories: completedMeals.reduce(
              (sum: number, meal: Meal) => sum + (meal.calories || 0),
              0,
            ),
            totalProtein: completedMeals.reduce(
              (sum: number, meal: Meal) => sum + (meal.protein || 0),
              0,
            ),
            totalCarbs: completedMeals.reduce(
              (sum: number, meal: Meal) => sum + (meal.carbs || 0),
              0,
            ),
            totalFats: completedMeals.reduce(
              (sum: number, meal: Meal) => sum + (meal.fats || 0),
              0,
            ),
          };
        }
        const finalMeals =
          updates.meals !== undefined
            ? deduplicateMeals(updatedMeals)
            : currentNutrition.meals;
        updatedNutrition = {
          ...currentNutrition,
          ...updates,
          meals: finalMeals,
          ...calculatedTotals,
        };
        return {
          data: { ...state.data, dailyNutrition: updatedNutrition },
        };
      });

      try {
        let resolvedDate: string;
        try {
          resolvedDate = getBrazilNutritionDateKey(updatedNutrition?.date);
        } catch {
          resolvedDate = getBrazilNutritionDateKey();
        }
        const hasMealsUpdate = updates.meals !== undefined;
        const hasWaterIntakeUpdate = updates.waterIntake !== undefined;
        const apiPayload: {
          date: string;
          meals?: Array<{
            id?: string;
            name: string;
            calories: number;
            protein: number;
            carbs: number;
            fats: number;
            completed?: boolean;
            type: string;
            foods: Array<{
              foodId: string;
              foodName: string;
              servings: number;
              calories: number;
              protein: number;
              carbs: number;
              fats: number;
              servingSize: string;
            }>;
          }>;
          waterIntake?: number;
        } = { date: resolvedDate };
        if (hasMealsUpdate) {
          apiPayload.meals = (updatedNutrition?.meals || []).map(
            (meal: Meal, index: number) => ({
              name: meal.name || "Refeição",
              type: meal.type || "snack",
              calories: meal.calories || 0,
              protein: meal.protein || 0,
              carbs: meal.carbs || 0,
              fats: meal.fats || 0,
              time: meal.time || null,
              completed: meal.completed || false,
              order: index,
              foods: (meal.foods || []).map(
                (food: import("@/lib/types").MealFoodItem) => ({
                  foodId: food.foodId || "",
                  foodName: food.foodName || "Alimento",
                  servings: food.servings || 1,
                  calories: food.calories || 0,
                  protein: food.protein || 0,
                  carbs: food.carbs || 0,
                  fats: food.fats || 0,
                  servingSize: food.servingSize || "100g",
                }),
              ),
            }),
          );
        }
        if (hasWaterIntakeUpdate) {
          apiPayload.waterIntake = updatedNutrition?.waterIntake || 0;
        }

        await apiClient.post("/api/nutrition/daily", apiPayload as any);
        await get().loadNutrition();
      } catch (error) {
        console.error("Erro ao atualizar nutrição:", error);
        set((state) => ({
          data: {
            ...state.data,
            dailyNutrition: previousNutrition,
          },
        }));
      }
    },
  };
}
