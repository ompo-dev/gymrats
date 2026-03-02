/**
 * Use Case: Update Daily Nutrition
 * Cria ou atualiza a nutrição diária (refeições + water intake) via transação.
 */

import { db } from "@/lib/db";

export interface NutritionFoodInput {
  foodId?: string | null;
  foodName: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize?: string | null;
}

export interface NutritionMealInput {
  name: string;
  type: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time?: string | null;
  completed?: boolean;
  foods?: NutritionFoodInput[];
}

export interface UpdateDailyNutritionInput {
  studentId: string;
  date?: string;
  waterIntake?: number;
  meals?: NutritionMealInput[];
}

export async function updateDailyNutritionUseCase(
  input: UpdateDailyNutritionInput,
): Promise<void> {
  const { studentId, date, waterIntake, meals } = input;
  const dateStr = date ?? new Date().toISOString().split("T")[0];
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  await db.$transaction(async (tx) => {
    const existing = await tx.dailyNutrition.findFirst({
      where: { studentId, date: { gte: startOfDay, lte: endOfDay } },
    });

    const daily = existing
      ? await tx.dailyNutrition.update({
          where: { id: existing.id },
          data: { waterIntake: waterIntake ?? existing.waterIntake },
        })
      : await tx.dailyNutrition.create({
          data: { studentId, date: startOfDay, waterIntake: waterIntake ?? 0 },
        });

    if (meals?.length) {
      await tx.nutritionMeal.deleteMany({
        where: { dailyNutritionId: daily.id },
      });

      for (let i = 0; i < meals.length; i++) {
        const meal = meals[i];
        const createdMeal = await tx.nutritionMeal.create({
          data: {
            dailyNutritionId: daily.id,
            name: meal.name,
            type: meal.type,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
            time: meal.time ?? null,
            completed: meal.completed ?? false,
            order: i,
          },
        });

        if (meal.foods?.length) {
          await tx.nutritionFoodItem.createMany({
            data: meal.foods.map((f) => ({
              nutritionMealId: createdMeal.id,
              foodId: f.foodId ?? null,
              foodName: f.foodName,
              servings: f.servings,
              calories: f.calories,
              protein: f.protein,
              carbs: f.carbs,
              fats: f.fats,
              servingSize: f.servingSize ?? "",
            })),
          });
        }
      }
    }
  });
}
