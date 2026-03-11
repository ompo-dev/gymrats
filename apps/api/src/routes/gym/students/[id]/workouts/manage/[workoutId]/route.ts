import type { NextRequest } from "@/runtime/next-server";
import {
  badRequestResponse,
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api/utils/response.utils";
import { updateWorkoutSchema } from "@/lib/api/schemas/workouts.schemas";
import { db } from "@/lib/db";
import { getGymContext } from "@/lib/utils/gym/gym-context";

/**
 * PUT /api/gym/students/[id]/workouts/manage/[workoutId]
 * Atualiza um treino do aluno.
 */
export async function PUT(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; workoutId: string }> },
) {
  try {
    const { ctx, errorResponse } = await getGymContext(request);
    if (errorResponse || !ctx) {
      return errorResponse ?? internalErrorResponse("Não autenticado");
    }

    const { id: studentId, workoutId } = await params;
    const membership = await db.gymMembership.findFirst({
      where: { gymId: ctx.gymId, studentId },
    });
    if (!membership) {
      return forbiddenResponse(
        "Aluno não encontrado ou não pertence a esta academia",
      );
    }

    const body = await request.json();
    const validation = updateWorkoutSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse("Dados inválidos", validation.error);
    }

    const workout = await db.workout.findUnique({
      where: { id: workoutId },
      include: { unit: true, planSlot: { include: { weeklyPlan: true } } },
    });

    if (!workout) return notFoundResponse("Treino não encontrado");

    const ownsWorkout =
      (workout.unit && workout.unit.studentId === studentId) ||
      (workout.planSlot &&
        workout.planSlot.weeklyPlan.studentId === studentId);

    if (!ownsWorkout) {
      return unauthorizedResponse("Você não pode editar este treino");
    }

    const updatedWorkout = await db.workout.update({
      where: { id: workoutId },
      data: validation.data,
    });

    return successResponse({
      data: updatedWorkout,
      message: "Treino atualizado com sucesso",
    });
  } catch (error) {
    console.error("[gym/workouts/manage] Erro PUT:", error);
    return internalErrorResponse("Erro ao atualizar treino");
  }
}

/**
 * DELETE /api/gym/students/[id]/workouts/manage/[workoutId]
 * Remove um treino do aluno.
 */
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; workoutId: string }> },
) {
  try {
    const { ctx, errorResponse } = await getGymContext(request);
    if (errorResponse || !ctx) {
      return errorResponse ?? internalErrorResponse("Não autenticado");
    }

    const { id: studentId, workoutId } = await params;
    const membership = await db.gymMembership.findFirst({
      where: { gymId: ctx.gymId, studentId },
    });
    if (!membership) {
      return forbiddenResponse(
        "Aluno não encontrado ou não pertence a esta academia",
      );
    }

    const workout = await db.workout.findUnique({
      where: { id: workoutId },
      include: { unit: true, planSlot: { include: { weeklyPlan: true } } },
    });

    if (!workout) return notFoundResponse("Treino não encontrado");

    const ownsWorkout =
      (workout.unit && workout.unit.studentId === studentId) ||
      (workout.planSlot &&
        workout.planSlot.weeklyPlan.studentId === studentId);

    if (!ownsWorkout) {
      return unauthorizedResponse("Você não pode excluir este treino");
    }

    if (workout.planSlot) {
      await db.planSlot.update({
        where: { id: workout.planSlot.id },
        data: { type: "rest", workoutId: null },
      });
    }

    await db.workout.delete({
      where: { id: workoutId },
    });

    return successResponse({ message: "Treino excluído com sucesso" });
  } catch (error) {
    console.error("[gym/workouts/manage] Erro DELETE:", error);
    if ((error as { code?: string })?.code === "P2025") {
      return notFoundResponse("Treino não encontrado para exclusão");
    }
    return internalErrorResponse("Erro ao excluir treino");
  }
}
