import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.student) {
      return NextResponse.json(
        { error: "Sessão inválida ou usuário não é aluno" },
        { status: 401 }
      );
    }

    const studentId = session.user.student.id;

    // Ler query params
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();

    // Normalizar data para início do dia
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Buscar perfil do aluno para targets
    const profile = await db.studentProfile.findUnique({
      where: { studentId: studentId },
      select: {
        targetCalories: true,
        targetProtein: true,
        targetCarbs: true,
        targetFats: true,
      },
    });

    // Se a tabela não existir (migration não aplicada), retornar dados vazios
    let dailyNutrition = null;
    try {
      // Buscar nutrição do dia
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
      if (
        error.code === "P2021" ||
        error.message?.includes("does not exist")
      ) {
        console.log(
          "Tabela daily_nutrition não existe ainda. Retornando dados vazios. Execute: node scripts/apply-nutrition-migration.js"
        );
        return NextResponse.json({
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
          targetWater: 3000, // ml
        });
      }
      throw error;
    }

    // Se não existe, criar registro vazio
    if (!dailyNutrition) {
      return NextResponse.json({
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
        targetWater: 3000, // ml
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

    return NextResponse.json({
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
      targetWater: 3000, // ml
    });
  } catch (error: any) {
    console.error("Erro ao buscar nutrição diária:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar nutrição" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.student) {
      return NextResponse.json(
        { error: "Sessão inválida ou usuário não é aluno" },
        { status: 401 }
      );
    }

    const studentId = session.user.student.id;

    // Ler dados do body
    const body = await request.json();
    const { date, meals, waterIntake } = body;

    // Normalizar data
    const nutritionDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(nutritionDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(nutritionDate);
    endOfDay.setHours(23, 59, 59, 999);

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

      return NextResponse.json({
        success: true,
        dailyNutritionId: dailyNutrition.id,
      });
    } catch (error: any) {
      // Se a tabela não existir, retornar erro informativo
      if (
        error.code === "P2021" ||
        error.message?.includes("does not exist")
      ) {
        console.log(
          "Tabela daily_nutrition não existe ainda. Execute: node scripts/apply-nutrition-migration.js"
        );
        return NextResponse.json(
          {
            error:
              "Tabela de nutrição não existe. Execute a migration: node scripts/apply-nutrition-migration.js",
            code: "MIGRATION_REQUIRED",
          },
          { status: 503 } // Service Unavailable
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Erro ao salvar nutrição:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao salvar nutrição" },
      { status: 500 }
    );
  }
}

