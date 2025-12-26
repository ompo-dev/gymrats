/**
 * Handler de Nutrition
 *
 * Centraliza toda a lógica das rotas relacionadas a nutrição e alimentos
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStudent } from "../middleware/auth.middleware";
import {
  successResponse,
  badRequestResponse,
  internalErrorResponse,
} from "../utils/response.utils";

/**
 * GET /api/nutrition/daily
 * Busca nutrição do dia
 */
export async function getDailyNutritionHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student.id;

    // Ler query params
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();

    // Normalizar data para UTC (evitar problemas de timezone)
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    // Buscar perfil para targets
    const profile = await db.studentProfile.findUnique({
      where: { studentId: studentId },
      select: {
        targetCalories: true,
        targetProtein: true,
        targetCarbs: true,
        targetFats: true,
      },
    });

    // Buscar nutrição do dia
    let dailyNutrition = null;
    try {
      dailyNutrition = await db.dailyNutrition.findFirst({
        where: {
          studentId: studentId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          meals: {
            orderBy: {
              order: "asc",
            },
            include: {
              foods: {
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
        },
      });
    } catch (error: any) {
      // Se a tabela não existir, retornar dados vazios
      if (error.code === "P2021" || error.message?.includes("does not exist")) {
        return successResponse({
          date: date.toISOString(),
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
          targetWater: 3000,
        });
      }
      throw error;
    }

    // Se não existe, retornar dados vazios
    if (!dailyNutrition) {
      return successResponse({
        date: date.toISOString(),
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
        targetWater: 3000,
      });
    }

    // Calcular totais
    const totalCalories = dailyNutrition.meals.reduce(
      (sum, meal) => sum + meal.calories,
      0
    );
    const totalProtein = dailyNutrition.meals.reduce(
      (sum, meal) => sum + meal.protein,
      0
    );
    const totalCarbs = dailyNutrition.meals.reduce(
      (sum, meal) => sum + meal.carbs,
      0
    );
    const totalFats = dailyNutrition.meals.reduce(
      (sum, meal) => sum + meal.fats,
      0
    );

    // Transformar para formato esperado
    const formattedMeals = dailyNutrition.meals.map((meal) => ({
      id: meal.id,
      name: meal.name,
      type: meal.type as "breakfast" | "lunch" | "dinner" | "snack",
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
      date: dailyNutrition.date.toISOString(),
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
      targetWater: 3000,
    });
  } catch (error: any) {
    console.error("[getDailyNutritionHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar nutrição", error);
  }
}

/**
 * POST /api/nutrition/daily
 * Atualiza nutrição do dia
 */
export async function updateDailyNutritionHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student.id;

    const body = await request.json();
    const { date, meals, waterIntake } = body;

    // Normalizar data para UTC (evitar problemas de timezone)
    const nutritionDate = date ? new Date(date) : new Date();
    const dateStr = nutritionDate.toISOString().split("T")[0]; // YYYY-MM-DD
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    try {
      // Buscar ou criar daily nutrition
      let dailyNutrition = await db.dailyNutrition.findFirst({
        where: {
          studentId: studentId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (!dailyNutrition) {
        dailyNutrition = await db.dailyNutrition.create({
          data: {
            studentId: studentId,
            date: startOfDay,
            waterIntake: waterIntake || 0,
          },
        });
      } else {
        // Atualizar waterIntake se fornecido
        if (waterIntake !== undefined) {
          dailyNutrition = await db.dailyNutrition.update({
            where: { id: dailyNutrition.id },
            data: { waterIntake: waterIntake },
          });
        }
      }

      // Se meals fornecidos, atualizar refeições
      if (meals && Array.isArray(meals)) {
        // Deletar refeições antigas
        await db.nutritionMeal.deleteMany({
          where: { dailyNutritionId: dailyNutrition.id },
        });

        // Criar novas refeições
        for (const meal of meals) {
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
              order: meal.order || 0,
            },
          });

          // Adicionar alimentos se fornecidos
          if (meal.foods && Array.isArray(meal.foods)) {
            for (const food of meal.foods) {
              await db.nutritionFoodItem.create({
                data: {
                  nutritionMealId: nutritionMeal.id,
                  foodId: food.foodId || null,
                  foodName: food.foodName,
                  servings: food.servings || 1,
                  calories: food.calories || 0,
                  protein: food.protein || 0,
                  carbs: food.carbs || 0,
                  fats: food.fats || 0,
                  servingSize: food.servingSize || "100g",
                },
              });
            }
          }
        }
      }

      return successResponse({
        dailyNutritionId: dailyNutrition.id,
        date: dailyNutrition.date.toISOString(),
      });
    } catch (error: any) {
      // Se a tabela não existir, retornar erro informativo
      if (error.code === "P2021" || error.message?.includes("does not exist")) {
        return badRequestResponse(
          "Tabela de nutrição não existe. Execute a migration: node scripts/apply-nutrition-migration.js",
          { code: "MIGRATION_REQUIRED" }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error("[updateDailyNutritionHandler] Erro:", error);
    return internalErrorResponse("Erro ao salvar nutrição", error);
  }
}

/**
 * GET /api/foods/search
 * Busca alimentos
 */
export async function searchFoodsHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Construir filtros
    const where: any = {};

    if (query) {
      where.name = {
        contains: query,
        mode: "insensitive",
      };
    }

    if (category) {
      where.category = category;
    }

    // Buscar alimentos
    let foods = [];
    try {
      foods = await db.foodItem.findMany({
        where: where,
        take: limit,
        orderBy: {
          name: "asc",
        },
      });
    } catch (error: any) {
      // Se a tabela não existir, retornar array vazio
      if (error.code === "P2021" || error.message?.includes("does not exist")) {
        return successResponse({
          foods: [],
        });
      }
      throw error;
    }

    // Transformar para formato esperado
    const formattedFoods = foods.map((food) => ({
      id: food.id,
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      servingSize: food.servingSize,
      category: food.category as
        | "protein"
        | "carbs"
        | "vegetables"
        | "fruits"
        | "fats"
        | "dairy"
        | "snacks",
      image: food.image || undefined,
    }));

    return successResponse({ foods: formattedFoods });
  } catch (error: any) {
    console.error("[searchFoodsHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar alimentos", error);
  }
}

/**
 * GET /api/foods/[id]
 * Busca detalhes de um alimento
 */
export async function getFoodByIdHandler(
  request: NextRequest,
  foodId: string
): Promise<NextResponse> {
  try {
    if (!foodId) {
      return badRequestResponse("ID do alimento não fornecido");
    }

    const food = await db.foodItem.findUnique({
      where: { id: foodId },
    });

    if (!food) {
      return successResponse({
        food: null,
        message: "Alimento não encontrado",
      });
    }

    return successResponse({
      food: {
        id: food.id,
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        servingSize: food.servingSize,
        category: food.category as
          | "protein"
          | "carbs"
          | "vegetables"
          | "fruits"
          | "fats"
          | "dairy"
          | "snacks",
        image: food.image || undefined,
      },
    });
  } catch (error: any) {
    console.error("[getFoodByIdHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar alimento", error);
  }
}
