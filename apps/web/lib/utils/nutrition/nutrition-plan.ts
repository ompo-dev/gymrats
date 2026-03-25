import type {
  DailyNutrition,
  Meal,
  MealFoodItem,
  NutritionPlanData,
  NutritionPlanFoodItemData,
  NutritionPlanMealData,
} from "@/lib/types";
import { getBrazilNutritionDateKey } from "@/lib/utils/brazil-nutrition-date";

function roundNutritionValue(value: number | null | undefined) {
  return Math.round(Number(value ?? 0));
}

function normalizeComparableNutritionFood(food: MealFoodItem) {
  return {
    foodId: food.foodId || null,
    foodName: food.foodName || "",
    servings: roundNutritionValue(food.servings),
    calories: roundNutritionValue(food.calories),
    protein: roundNutritionValue(food.protein),
    carbs: roundNutritionValue(food.carbs),
    fats: roundNutritionValue(food.fats),
    servingSize: food.servingSize || "",
  };
}

function normalizeComparableNutritionMeal(meal: Meal, order: number) {
  return {
    name: meal.name || "",
    type: meal.type || "snack",
    calories: roundNutritionValue(meal.calories),
    protein: roundNutritionValue(meal.protein),
    carbs: roundNutritionValue(meal.carbs),
    fats: roundNutritionValue(meal.fats),
    time: meal.time || null,
    order,
    foods: (meal.foods || []).map(normalizeComparableNutritionFood),
  };
}

export function hasNutritionMealStructureChanged(
  previousMeals: Meal[],
  nextMeals: Meal[],
) {
  if (previousMeals.length !== nextMeals.length) {
    return true;
  }

  for (let index = 0; index < previousMeals.length; index += 1) {
    const previousMeal = normalizeComparableNutritionMeal(
      previousMeals[index],
      index,
    );
    const nextMeal = normalizeComparableNutritionMeal(nextMeals[index], index);

    if (
      previousMeal.name !== nextMeal.name ||
      previousMeal.type !== nextMeal.type ||
      previousMeal.calories !== nextMeal.calories ||
      previousMeal.protein !== nextMeal.protein ||
      previousMeal.carbs !== nextMeal.carbs ||
      previousMeal.fats !== nextMeal.fats ||
      previousMeal.time !== nextMeal.time ||
      previousMeal.order !== nextMeal.order ||
      previousMeal.foods.length !== nextMeal.foods.length
    ) {
      return true;
    }

    for (
      let foodIndex = 0;
      foodIndex < previousMeal.foods.length;
      foodIndex += 1
    ) {
      const previousFood = previousMeal.foods[foodIndex];
      const nextFood = nextMeal.foods[foodIndex];

      if (
        previousFood.foodId !== nextFood.foodId ||
        previousFood.foodName !== nextFood.foodName ||
        previousFood.servings !== nextFood.servings ||
        previousFood.calories !== nextFood.calories ||
        previousFood.protein !== nextFood.protein ||
        previousFood.carbs !== nextFood.carbs ||
        previousFood.fats !== nextFood.fats ||
        previousFood.servingSize !== nextFood.servingSize
      ) {
        return true;
      }
    }
  }

  return false;
}

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
  const meals = Array.isArray(data?.meals)
    ? data.meals
    : (fallback?.meals ?? []);
  const completedTotals = calculateCompletedNutritionTotals(meals);

  return {
    date:
      typeof data?.date === "string"
        ? getBrazilNutritionDateKey(data.date)
        : typeof fallback?.date === "string"
          ? getBrazilNutritionDateKey(fallback.date)
          : getBrazilNutritionDateKey(),
    meals,
    totalCalories: roundNutritionValue(
      data?.totalCalories ?? completedTotals.totalCalories,
    ),
    totalProtein: roundNutritionValue(
      data?.totalProtein ?? completedTotals.totalProtein,
    ),
    totalCarbs: roundNutritionValue(
      data?.totalCarbs ?? completedTotals.totalCarbs,
    ),
    totalFats: roundNutritionValue(
      data?.totalFats ?? completedTotals.totalFats,
    ),
    waterIntake: data?.waterIntake ?? fallback?.waterIntake ?? 0,
    targetCalories: roundNutritionValue(
      data?.targetCalories ?? fallback?.targetCalories ?? 2000,
    ),
    targetProtein: roundNutritionValue(
      data?.targetProtein ?? fallback?.targetProtein ?? 150,
    ),
    targetCarbs: roundNutritionValue(
      data?.targetCarbs ?? fallback?.targetCarbs ?? 250,
    ),
    targetFats: roundNutritionValue(
      data?.targetFats ?? fallback?.targetFats ?? 65,
    ),
    targetWater: data?.targetWater ?? fallback?.targetWater ?? 3000,
    sourceNutritionPlanId:
      data?.sourceNutritionPlanId ?? fallback?.sourceNutritionPlanId ?? null,
    hasActiveNutritionPlan:
      data?.hasActiveNutritionPlan ?? fallback?.hasActiveNutritionPlan ?? false,
    isLegacyFallback:
      data?.isLegacyFallback ?? fallback?.isLegacyFallback ?? false,
  };
}

export function mealFoodToPlanFood(
  food: MealFoodItem,
): NutritionPlanFoodItemData {
  return {
    id: food.id,
    foodId: food.foodId,
    foodName: food.foodName,
    servings: food.servings,
    calories: roundNutritionValue(food.calories),
    protein: roundNutritionValue(food.protein),
    carbs: roundNutritionValue(food.carbs),
    fats: roundNutritionValue(food.fats),
    servingSize: food.servingSize,
  };
}

export function mealToNutritionPlanMeal(
  meal: Meal,
  order: number,
): NutritionPlanMealData {
  return {
    id: meal.id,
    name: meal.name,
    type: meal.type,
    calories: roundNutritionValue(meal.calories),
    protein: roundNutritionValue(meal.protein),
    carbs: roundNutritionValue(meal.carbs),
    fats: roundNutritionValue(meal.fats),
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
    calories: roundNutritionValue(meal.calories),
    protein: roundNutritionValue(meal.protein),
    carbs: roundNutritionValue(meal.carbs),
    fats: roundNutritionValue(meal.fats),
    time: meal.time,
    completed: false,
    foods: meal.foods.map((food) => ({
      id: food.id,
      foodId: food.foodId || "",
      foodName: food.foodName,
      servings: food.servings,
      calories: roundNutritionValue(food.calories),
      protein: roundNutritionValue(food.protein),
      carbs: roundNutritionValue(food.carbs),
      fats: roundNutritionValue(food.fats),
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
    totalCalories: roundNutritionValue(targets.totalCalories),
    targetProtein: roundNutritionValue(targets.targetProtein),
    targetCarbs: roundNutritionValue(targets.targetCarbs),
    targetFats: roundNutritionValue(targets.targetFats),
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
        targetCalories: roundNutritionValue(params.plan.totalCalories),
        targetProtein: roundNutritionValue(params.plan.targetProtein),
        targetCarbs: roundNutritionValue(params.plan.targetCarbs),
        targetFats: roundNutritionValue(params.plan.targetFats),
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
