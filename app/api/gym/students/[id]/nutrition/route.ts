import type { NextRequest } from "next/server";
import {
  badRequestResponse,
  forbiddenResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { updateDailyNutritionSchema } from "@/lib/api/schemas";
import { db } from "@/lib/db";
import {
  getBrazilNutritionDateKey,
  getBrazilNutritionDayRange,
} from "@/lib/utils/brazil-nutrition-date";
import { getGymContext } from "@/lib/utils/gym/gym-context";

/**
 * GET /api/gym/students/[id]/nutrition?date=YYYY-MM-DD
 * Retorna a nutrição do dia do aluno para visualização pela academia.
 * Requer: usuário logado como gym; aluno deve pertencer à academia.
 * Query: date (opcional) - data no formato YYYY-MM-DD. Default: hoje.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) {
      return errorResponse ?? internalErrorResponse("Não autenticado");
    }

    const { id: studentId } = await params;

    const membership = await db.gymMembership.findFirst({
      where: { gymId: ctx.gymId, studentId },
    });
    if (!membership) {
      return forbiddenResponse(
        "Aluno não encontrado ou não pertence a esta academia",
      );
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") ?? undefined;

    let dateKey: string;
    try {
      dateKey = getBrazilNutritionDateKey(dateParam);
    } catch {
      return badRequestResponse("Data inválida fornecida");
    }

    const { start: startOfDay, end: endOfDay } =
      getBrazilNutritionDayRange(dateKey);

    const profile = await db.studentProfile.findUnique({
      where: { studentId },
      select: {
        targetCalories: true,
        targetProtein: true,
        targetCarbs: true,
        targetFats: true,
        targetWater: true,
      },
    });

    let dailyNutrition = null;
    try {
      dailyNutrition = await db.dailyNutrition.findFirst({
        where: {
          studentId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
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
    } catch (error) {
      const err = error as { code?: string; message?: string };
      if (err.code === "P2021" || err.message?.includes("does not exist")) {
        return successResponse({
          date: dateKey,
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
          targetWater: profile?.targetWater ?? 3000,
        });
      }
      throw error;
    }

    if (!dailyNutrition) {
      return successResponse({
        date: dateKey,
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
        targetWater: profile?.targetWater ?? 3000,
      });
    }

    const completedMeals = dailyNutrition.meals.filter(
      (meal) => meal.completed === true,
    );
    const totalCalories = completedMeals.reduce(
      (sum, meal) => sum + meal.calories,
      0,
    );
    const totalProtein = completedMeals.reduce(
      (sum, meal) => sum + meal.protein,
      0,
    );
    const totalCarbs = completedMeals.reduce(
      (sum, meal) => sum + meal.carbs,
      0,
    );
    const totalFats = completedMeals.reduce((sum, meal) => sum + meal.fats, 0);

    const formattedMeals = dailyNutrition.meals.map((meal) => ({
      id: meal.id,
      name: meal.name,
      type: meal.type as
        | "breakfast"
        | "lunch"
        | "dinner"
        | "snack"
        | "afternoon-snack"
        | "pre-workout"
        | "post-workout",
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      time: meal.time || undefined,
      completed: meal.completed,
      foods: meal.foods.map((food) => ({
        id: food.id,
        foodId: food.foodId || undefined,
        foodName: food.foodName,
        servings: food.servings,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        servingSize: food.servingSize,
      })),
    }));

    return successResponse({
      date: dateKey,
      meals: formattedMeals,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
      waterIntake: dailyNutrition.waterIntake,
      targetCalories: profile?.targetCalories || 2000,
      targetProtein: profile?.targetProtein || 150,
      targetCarbs: profile?.targetCarbs || 250,
      targetFats: profile?.targetFats || 65,
      targetWater: profile?.targetWater ?? 3000,
    });
  } catch (error) {
    console.error("[gym/students/[id]/nutrition] Erro:", error);
    return internalErrorResponse("Erro ao buscar nutrição");
  }
}

/**
 * POST /api/gym/students/[id]/nutrition
 * Atualiza a nutrição do dia do aluno pela academia.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) {
      return errorResponse ?? internalErrorResponse("Não autenticado");
    }

    const { id: studentId } = await params;

    const membership = await db.gymMembership.findFirst({
      where: { gymId: ctx.gymId, studentId },
    });
    if (!membership) {
      return forbiddenResponse(
        "Aluno não encontrado ou não pertence a esta academia",
      );
    }

    const validation = await validateBody(request, updateDailyNutritionSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { date, meals, targetWater } = validation.data;

    if (targetWater !== undefined) {
      await db.studentProfile.upsert({
        where: { studentId },
        create: { studentId, targetWater },
        update: { targetWater },
      });
    }

    const hasNutritionPayload = meals !== undefined || date !== undefined;

    if (!hasNutritionPayload) {
      return successResponse({ message: "Meta de água atualizada com sucesso" });
    }

    let dateKey: string;
    try {
      dateKey = getBrazilNutritionDateKey(date);
    } catch {
      return badRequestResponse("Data inválida fornecida");
    }

    const { start: startOfDay, end: endOfDay } =
      getBrazilNutritionDayRange(dateKey);

    let dailyNutrition = await db.dailyNutrition.findFirst({
      where: {
        studentId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (!dailyNutrition) {
      dailyNutrition = await db.dailyNutrition.create({
        data: {
          studentId,
          date: startOfDay,
          waterIntake: 0,
        },
      });
    }

    if (meals && Array.isArray(meals)) {
      await db.nutritionMeal.deleteMany({
        where: { dailyNutritionId: dailyNutrition.id },
      });

      for (const meal of meals) {
        if (!meal.name || !meal.type) {
          console.warn(
            "[gym/nutrition] Meal sem name ou type, pulando:",
            meal,
          );
          continue;
        }

        const nutritionMeal = await db.nutritionMeal.create({
          data: {
            dailyNutritionId: dailyNutrition.id,
            name: meal.name,
            type: meal.type,
            calories: meal.calories || 0,
            protein: meal.protein || 0,
            carbs: meal.carbs || 0,
            fats: meal.fats || 0,
            time: meal.time || null,
            completed: meal.completed || false,
            order: meal.order !== undefined ? meal.order : 0,
          },
        });

        if (meal.foods && Array.isArray(meal.foods)) {
          for (const food of meal.foods) {
            if (!food.foodName) {
              console.warn(
                "[gym/nutrition] Food sem foodName, pulando:",
                food,
              );
              continue;
            }

            await db.nutritionFood.create({
              data: {
                nutritionMealId: nutritionMeal.id,
                foodId: food.foodId || null,
                foodName: food.foodName,
                servings: food.servings || 1,
                calories: food.calories || 0,
                protein: food.protein || 0,
                carbs: food.carbs || 0,
                fats: food.fats || 0,
                servingSize: food.servingSize || "",
              },
            });
          }
        }
      }
    }

    return successResponse({ message: "Nutrição atualizada com sucesso" });
  } catch (error) {
    console.error("[gym/students/[id]/nutrition] Erro POST:", error);
    return internalErrorResponse("Erro ao atualizar nutrição");
  }
}
