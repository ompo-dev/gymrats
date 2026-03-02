/**
 * Use Case: Get Daily Nutrition
 * Busca a nutrição diária do student para uma data específica.
 */

import { db } from "@/lib/db";

export interface GetDailyNutritionInput {
  studentId: string;
  date?: string;
}

export interface NutritionFoodDTO {
  id: string;
  foodId: string | null;
  foodName: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string;
}

export interface NutritionMealDTO {
  id: string;
  name: string;
  type: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  completed: boolean;
  time?: string;
  foods: NutritionFoodDTO[];
}

export interface GetDailyNutritionOutput {
  date: string;
  meals: NutritionMealDTO[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  waterIntake: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  targetWater: number;
}

export async function getDailyNutritionUseCase(
  input: GetDailyNutritionInput,
): Promise<GetDailyNutritionOutput> {
  const { studentId, date } = input;
  const dateStr = date ?? new Date().toISOString().split("T")[0];
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  const [profile, dailyNutrition] = await Promise.all([
    db.studentProfile.findUnique({
      where: { studentId },
      select: {
        targetCalories: true,
        targetProtein: true,
        targetCarbs: true,
        targetFats: true,
      },
    }),
    db.dailyNutrition.findFirst({
      where: { studentId, date: { gte: startOfDay, lte: endOfDay } },
      include: {
        meals: {
          orderBy: { order: "asc" },
          include: { foods: { orderBy: { createdAt: "asc" } } },
        },
      },
    }),
  ]);

  const defaults = {
    targetCalories: profile?.targetCalories ?? 2000,
    targetProtein: profile?.targetProtein ?? 150,
    targetCarbs: profile?.targetCarbs ?? 250,
    targetFats: profile?.targetFats ?? 65,
    targetWater: 2000,
  };

  if (!dailyNutrition) {
    return {
      date: dateStr,
      meals: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      waterIntake: 0,
      ...defaults,
    };
  }

  const meals: NutritionMealDTO[] = dailyNutrition.meals.map((meal) => ({
    id: meal.id,
    name: meal.name,
    type: meal.type,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fats: meal.fats,
    completed: meal.completed,
    time: meal.time ?? undefined,
    foods: meal.foods.map((food) => ({
      id: food.id,
      foodId: food.foodId,
      foodName: food.foodName,
      servings: food.servings,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      servingSize: food.servingSize,
    })),
  }));

  return {
    date: dailyNutrition.date.toISOString().split("T")[0],
    meals,
    totalCalories: meals.reduce((sum, m) => sum + m.calories, 0),
    totalProtein: meals.reduce((sum, m) => sum + m.protein, 0),
    totalCarbs: meals.reduce((sum, m) => sum + m.carbs, 0),
    totalFats: meals.reduce((sum, m) => sum + m.fats, 0),
    waterIntake: dailyNutrition.waterIntake,
    ...defaults,
  };
}
