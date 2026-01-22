import { db } from "@/lib/db";
import type { Context } from "elysia";
import {
  dailyNutritionQuerySchema,
  dailyNutritionUpdateSchema,
  foodSearchQuerySchema,
} from "@/lib/api/schemas/nutrition.schemas";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "../utils/response";
import { validateBody, validateQuery } from "../utils/validation";

type NutritionContext = {
  set: Context["set"];
  query?: Record<string, unknown>;
  body?: unknown;
  studentId: string;
};

export async function getDailyNutritionHandler({
  set,
  query,
  studentId,
}: NutritionContext) {
  try {
    const queryValidation = validateQuery(
      (query || {}) as Record<string, unknown>,
      dailyNutritionQuerySchema
    );
    if (!queryValidation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${queryValidation.errors.join("; ")}`,
        { errors: queryValidation.errors }
      );
    }

    const date = queryValidation.data.date;
    const dateStr = date || new Date().toISOString().split("T")[0];
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const profile = await db.studentProfile.findUnique({
      where: { studentId },
      select: {
        targetCalories: true,
        targetProtein: true,
        targetCarbs: true,
        targetFats: true,
      },
    });

    const dailyNutrition = await db.dailyNutrition.findFirst({
      where: {
        studentId,
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        meals: {
          orderBy: { order: "asc" },
          include: {
            foods: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!dailyNutrition) {
      return successResponse(set, {
        date: dateStr,
        meals: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFats: 0,
        waterIntake: 0,
        targetCalories: profile?.targetCalories || 2000,
        targetProtein: profile?.targetProtein || 150,
        targetCarbs: profile?.targetCarbs || 250,
        targetFats: profile?.targetFats || 65,
        targetWater: 2000,
      });
    }

    const meals = dailyNutrition.meals.map((meal) => ({
      id: meal.id,
      name: meal.name,
      type: meal.type,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      completed: meal.completed,
      time: meal.time || undefined,
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

    return successResponse(set, {
      date: dailyNutrition.date.toISOString().split("T")[0],
      meals,
      totalCalories: meals.reduce((sum, m) => sum + m.calories, 0),
      totalProtein: meals.reduce((sum, m) => sum + m.protein, 0),
      totalCarbs: meals.reduce((sum, m) => sum + m.carbs, 0),
      totalFats: meals.reduce((sum, m) => sum + m.fats, 0),
      waterIntake: dailyNutrition.waterIntake,
      targetCalories: profile?.targetCalories || 2000,
      targetProtein: profile?.targetProtein || 150,
      targetCarbs: profile?.targetCarbs || 250,
      targetFats: profile?.targetFats || 65,
      targetWater: 2000,
    });
  } catch (error) {
    console.error("[getDailyNutritionHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar nutrição diária", error);
  }
}

export async function updateDailyNutritionHandler({
  set,
  body,
  studentId,
}: NutritionContext) {
  try {
    const validation = validateBody(body, dailyNutritionUpdateSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    const { date, meals, waterIntake } = validation.data as any;
    const dateStr = date || new Date().toISOString().split("T")[0];
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);

    const existing = await db.dailyNutrition.findFirst({
      where: {
        studentId,
        date: {
          gte: startOfDay,
          lte: new Date(`${dateStr}T23:59:59.999Z`),
        },
      },
    });

    const dailyNutrition = existing
      ? await db.dailyNutrition.update({
          where: { id: existing.id },
          data: { waterIntake: waterIntake ?? existing.waterIntake },
        })
      : await db.dailyNutrition.create({
          data: { studentId, date: startOfDay, waterIntake: waterIntake || 0 },
        });

    if (meals && Array.isArray(meals)) {
      await db.nutritionMeal.deleteMany({
        where: { dailyNutritionId: dailyNutrition.id },
      });

      for (let i = 0; i < meals.length; i++) {
        const meal = meals[i];
        const createdMeal = await db.nutritionMeal.create({
          data: {
            dailyNutritionId: dailyNutrition.id,
            name: meal.name,
            type: meal.type,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
            time: meal.time || null,
            completed: meal.completed || false,
            order: i,
          },
        });

        if (meal.foods && Array.isArray(meal.foods)) {
          await db.nutritionFoodItem.createMany({
            data: meal.foods.map((food: any) => ({
              nutritionMealId: createdMeal.id,
              foodId: food.foodId || null,
              foodName: food.foodName,
              servings: food.servings,
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fats: food.fats,
              servingSize: food.servingSize,
            })),
          });
        }
      }
    }

    return successResponse(set, { message: "Nutrição diária atualizada" });
  } catch (error) {
    console.error("[updateDailyNutritionHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao atualizar nutrição diária", error);
  }
}

export async function searchFoodsHandler({
  set,
  query,
}: {
  set: NutritionContext["set"];
  query?: Record<string, unknown>;
}) {
  try {
    const queryValidation = validateQuery(
      (query || {}) as Record<string, unknown>,
      foodSearchQuerySchema
    );
    if (!queryValidation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${queryValidation.errors.join("; ")}`,
        { errors: queryValidation.errors }
      );
    }

    const { query: searchQuery } = queryValidation.data as any;
    const foods = await db.foodItem.findMany({
      where: {
        name: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
      take: 20,
    });

    return successResponse(set, { foods });
  } catch (error) {
    console.error("[searchFoodsHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar alimentos", error);
  }
}

export async function getFoodByIdHandler({
  set,
  params,
}: {
  set: NutritionContext["set"];
  params?: Record<string, string>;
}) {
  try {
    const id = params?.id;
    if (!id) {
      return badRequestResponse(set, "ID do alimento é obrigatório");
    }

    const food = await db.foodItem.findUnique({ where: { id } });
    if (!food) return notFoundResponse(set, "Alimento não encontrado");

    return successResponse(set, { food });
  } catch (error) {
    console.error("[getFoodByIdHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar alimento", error);
  }
}
