import type { NextRequest } from "@/runtime/next-server";
import {
  badRequestResponse,
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api/utils/response.utils";
import { updateWorkoutExerciseSchema } from "@/lib/api/schemas/workouts.schemas";
import { db } from "@/lib/db";
import { normalizeEducationalData } from "@/lib/utils/workout-exercise";
import { getGymContext } from "@/lib/utils/gym/gym-context";

/**
 * PUT /api/gym/students/[id]/workouts/exercises/[exerciseId]
 * Atualiza exercício do treino do aluno.
 */
export async function PUT(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; exerciseId: string }> },
) {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) {
      return errorResponse ?? internalErrorResponse("Não autenticado");
    }

    const { id: studentId, exerciseId } = await params;
    const membership = await db.gymMembership.findFirst({
      where: { gymId: ctx.gymId, studentId },
    });
    if (!membership) {
      return forbiddenResponse(
        "Aluno não encontrado ou não pertence a esta academia",
      );
    }

    const body = await request.json();
    const validation = updateWorkoutExerciseSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse("Dados inválidos", validation.error);
    }

    const exercise = await db.workoutExercise.findUnique({
      where: { id: exerciseId },
      include: {
        workout: {
          include: {
            unit: true,
            planSlot: { include: { weeklyPlan: true } },
          },
        },
      },
    });

    if (!exercise) return notFoundResponse("Exercício não encontrado");

    if (!exercise.workout) {
      return internalErrorResponse("Exercício sem treino vinculado");
    }

    const ownsViaUnit =
      exercise.workout.unit && exercise.workout.unit.studentId === studentId;
    const ownsViaPlanSlot =
      exercise.workout.planSlot &&
      exercise.workout.planSlot.weeklyPlan.studentId === studentId;

    if (!ownsViaUnit && !ownsViaPlanSlot) {
      return unauthorizedResponse("Você não pode editar este exercício");
    }

    const normalizedData = normalizeEducationalData(validation.data);

    const updatedExercise = await db.workoutExercise.update({
      where: { id: exerciseId },
      data: normalizedData,
    });

    return successResponse({
      data: updatedExercise,
      message: "Exercício atualizado com sucesso",
    });
  } catch (error) {
    console.error("[gym/exercises] Erro PUT:", error);
    return internalErrorResponse("Erro ao atualizar exercício");
  }
}

/**
 * DELETE /api/gym/students/[id]/workouts/exercises/[exerciseId]
 * Remove exercício do treino do aluno.
 */
export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; exerciseId: string }> },
) {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) {
      return errorResponse ?? internalErrorResponse("Não autenticado");
    }

    const { id: studentId, exerciseId } = await params;
    const membership = await db.gymMembership.findFirst({
      where: { gymId: ctx.gymId, studentId },
    });
    if (!membership) {
      return forbiddenResponse(
        "Aluno não encontrado ou não pertence a esta academia",
      );
    }

    const exercise = await db.workoutExercise.findUnique({
      where: { id: exerciseId },
      include: {
        workout: {
          include: {
            unit: true,
            planSlot: { include: { weeklyPlan: true } },
          },
        },
      },
    });

    if (!exercise) return notFoundResponse("Exercício não encontrado");

    if (!exercise.workout) {
      console.error("Exercício sem treino vinculado", { exerciseId });
      return internalErrorResponse(
        "Erro de inconsistência de dados. Contate o suporte.",
      );
    }

    const workout = exercise.workout;
    const ownsViaUnit = workout.unit && workout.unit.studentId === studentId;
    const ownsViaPlanSlot =
      workout.planSlot && workout.planSlot.weeklyPlan.studentId === studentId;

    if (!ownsViaUnit && !ownsViaPlanSlot) {
      return unauthorizedResponse("Você não pode excluir este exercício");
    }

    await db.workoutExercise.delete({
      where: { id: exerciseId },
    });

    return successResponse({ message: "Exercício excluído com sucesso" });
  } catch (error) {
    console.error("[gym/exercises] Erro DELETE:", error);
    if ((error as { code?: string })?.code === "P2025") {
      return notFoundResponse("Exercício não encontrado para exclusão");
    }
    return internalErrorResponse("Erro ao excluir exercício");
  }
}
