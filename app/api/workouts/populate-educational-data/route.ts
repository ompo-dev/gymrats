import type { NextRequest } from "next/server";
import { requireStudent } from "@/lib/api/middleware/auth.middleware";
import {
	internalErrorResponse,
	successResponse,
} from "@/lib/api/utils/response.utils";
import { populateWorkoutExercisesWithEducationalData } from "@/lib/services/populate-workout-exercises-educational-data";

/**
 * POST /api/workouts/populate-educational-data
 * Popula todos os WorkoutExercises existentes com dados do educational database
 */
export async function POST(request: NextRequest) {
	try {
		const auth = await requireStudent(request);
		if ("error" in auth) {
			return auth.response;
		}

		const result = await populateWorkoutExercisesWithEducationalData();

		return successResponse({
			message: "Exercícios populados com dados educacionais",
			...result,
		});
	} catch (error: unknown) {
		console.error("[populateEducationalData] Erro:", error);
		return internalErrorResponse(
			"Erro ao popular exercícios com dados educacionais",
			error,
		);
	}
}
