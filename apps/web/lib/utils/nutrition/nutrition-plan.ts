import type {
  DailyNutrition,
  Meal,
  MealFoodItem,
  NutritionPlanData,
  NutritionPlanFoodItemData,
  NutritionPlanMealData,
} from "@/lib/types";
import { getBrazilNutritionDateKey } from "@/lib/utils/brazil-nutrition-date";

export function calculateCompletedNutritionTotals(meals: Meal[]) {
  const completedMeals = meals.filter((meal) => meal.completed === true);

  return completedMeals.reduce(
    (accumulator, meal) => ({
      totalCalories: accumulator.totalCalories + (meal.calories || 0),
      totalProtein: accumulator.totalProtein + (meal.protein || 0),
      totalCarbs: accumulator.totalCarbs + (meal.carbs || 0),
      totalFats: accumulator.totalFats + (meal.fats || 0),
    }),
    {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
    },
  );
}

export function calculateNutritionPlanTargets(meals: Meal[]) {
  return meals.reduce(
    (accumulator, meal) => ({
      totalCalories: accumulator.totalCalories + (meal.calories || 0),
      targetProtein: accumulator.targetProtein + (meal.protein || 0),
      targetCarbs: accumulator.targetCarbs + (meal.carbs || 0),
      targetFats: accumulator.targetFats + (meal.fats || 0),
    }),
    {
      totalCalories: 0,
      targetProtein: 0,
      targetCarbs: 0,
      targetFats: 0,
    },
  );
}

export function normalizeDailyNutrition(
  data: Partial<DailyNutrition> | null | undefined,
  fallback?: Partial<DailyNutrition>,
): DailyNutrition {
  const meals = Array.isArray(data?.meals) ? data.meals : fallback?.meals ?? [];
  const completedTotals = calculateCompletedNutritionTotals(meals);

  return {
    date:
      typeof data?.date === "string"
        ? getBrazilNutritionDateKey(data.date)
        : typeof fallback?.date === "string"
          ? getBrazilNutritionDateKey(fallback.date)
          : getBrazilNutritionDateKey(),
    meals,
    totalCalories: data?.totalCalories ?? completedTotals.totalCalories,
    totalProtein: data?.totalProtein ?? completedTotals.totalProtein,
    totalCarbs: data?.totalCarbs ?? completedTotals.totalCarbs,
    totalFats: data?.totalFats ?? completedTotals.totalFats,
    waterIntake: data?.waterIntake ?? fallback?.waterIntake ?? 0,
    targetCalories: data?.targetCalories ?? fallback?.targetCalories ?? 2000,
    targetProtein: data?.targetProtein ?? fallback?.targetProtein ?? 150,
    targetCarbs: data?.targetCarbs ?? fallback?.targetCarbs ?? 250,
    targetFats: data?.targetFats ?? fallback?.targetFats ?? 65,
    targetWater: data?.targetWater ?? fallback?.targetWater ?? 3000,
    sourceNutritionPlanId:
      data?.sourceNutritionPlanId ?? fallback?.sourceNutritionPlanId ?? null,
    hasActiveNutritionPlan:
      data?.hasActiveNutritionPlan ?? fallback?.hasActiveNutritionPlan ?? false,
    isLegacyFallback:
      data?.isLegacyFallback ?? fallback?.isLegacyFallback ?? false,
  };
}

export function mealFoodToPlanFood(food: MealFoodItem): NutritionPlanFoodItemData {
  return {
    id: food.id,
    foodId: food.foodId,
    foodName: food.foodName,
    servings: food.servings,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fats: food.fats,
    servingSize: food.servingSize,
  };
}

export function mealToNutritionPlanMeal(meal: Meal, order: number): NutritionPlanMealData {
  return {
    id: meal.id,
    name: meal.name,
    type: meal.type,
    calories: meal.calories || 0,
    protein: meal.protein || 0,
    carbs: meal.carbs || 0,
    fats: meal.fats || 0,
    time: meal.time,
    order,
    foods: (meal.foods || []).map(mealFoodToPlanFood),
  };
}

export function nutritionPlanToMeals(
  plan: NutritionPlanData | null | undefined,
): Meal[] {
  return (plan?.meals || []).map((meal) => ({
    id: meal.id,
    name: meal.name,
    type: meal.type,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fats: meal.fats,
    time: meal.time,
    completed: false,
    foods: meal.foods.map((food) => ({
      id: food.id,
      foodId: food.foodId || "",
      foodName: food.foodName,
      servings: food.servings,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      servingSize: food.servingSize,
    })),
  }));
}

export function mealsToNutritionPlanData(params: {
  meals: Meal[];
  basePlan?: NutritionPlanData | null;
}): NutritionPlanData {
  const meals = params.meals.map((meal, index) =>
    mealToNutritionPlanMeal(meal, index),
  );
  const targets = calculateNutritionPlanTargets(params.meals);

  return {
    id: params.basePlan?.id ?? "temp-active-nutrition-plan",
    title: params.basePlan?.title ?? "Meu Plano Alimentar",
    description: params.basePlan?.description ?? null,
    totalCalories: targets.totalCalories,
    targetProtein: targets.targetProtein,
    targetCarbs: targets.targetCarbs,
    targetFats: targets.targetFats,
    isLibraryTemplate: params.basePlan?.isLibraryTemplate ?? false,
    createdById: params.basePlan?.createdById ?? null,
    creatorType: params.basePlan?.creatorType ?? null,
    sourceLibraryPlanId: params.basePlan?.sourceLibraryPlanId ?? null,
    meals,
  };
}

export function createDailyNutritionFromPlan(params: {
  plan: NutritionPlanData | null | undefined;
  baseNutrition?: DailyNutrition | null;
  date?: string;
}): DailyNutrition {
  const meals = nutritionPlanToMeals(params.plan);
  const targets = params.plan
    ? {
        targetCalories: params.plan.totalCalories,
        targetProtein: params.plan.targetProtein,
        targetCarbs: params.plan.targetCarbs,
        targetFats: params.plan.targetFats,
      }
    : {
        targetCalories: params.baseNutrition?.targetCalories ?? 2000,
        targetProtein: params.baseNutrition?.targetProtein ?? 150,
        targetCarbs: params.baseNutrition?.targetCarbs ?? 250,
        targetFats: params.baseNutrition?.targetFats ?? 65,
      };

  return normalizeDailyNutrition(
    {
      date: params.date ?? params.baseNutrition?.date,
      meals,
      waterIntake: params.baseNutrition?.waterIntake ?? 0,
      targetWater: params.baseNutrition?.targetWater ?? 3000,
      sourceNutritionPlanId: params.plan?.id ?? null,
      hasActiveNutritionPlan: Boolean(params.plan),
      isLegacyFallback: false,
      ...targets,
    },
    params.baseNutrition ?? undefined,
  );
}
