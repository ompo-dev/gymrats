import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getGymContext } from "@/lib/utils/gym/gym-context";
import {
	getBrazilNutritionDateKey,
	getBrazilNutritionDayRange,
} from "@/lib/utils/brazil-nutrition-date";
import {
	badRequestResponse,
	forbiddenResponse,
	internalErrorResponse,
	successResponse,
} from "@/lib/api/utils/response.utils";

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
			return forbiddenResponse("Aluno não encontrado ou não pertence a esta academia");
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
					targetWater: 3000,
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
				targetWater: 3000,
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
		const totalFats = completedMeals.reduce(
			(sum, meal) => sum + meal.fats,
			0,
		);

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
			targetWater: 3000,
		});
	} catch (error) {
		console.error("[gym/students/[id]/nutrition] Erro:", error);
		return internalErrorResponse("Erro ao buscar nutrição");
	}
}
