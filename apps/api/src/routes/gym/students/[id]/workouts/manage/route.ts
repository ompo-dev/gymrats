import { createWorkoutSchema } from "@/lib/api/schemas/workouts.schemas";
import {
  badRequestResponse,
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api/utils/response.utils";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { getGymContext } from "@/lib/utils/gym/gym-context";
import type { NextRequest } from "@/runtime/next-server";

/**
 * POST /api/gym/students/[id]/workouts/manage
 * Cria um treino para o aluno (slot do plano semanal ou unit).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { ctx, errorResponse } = await getGymContext(request);
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

    const body = await request.json();
    const validation = createWorkoutSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse("Dados inválidos", validation.error);
    }

    const { unitId, planSlotId, ...workoutData } = validation.data;

    let order = 0;

    if (planSlotId) {
      const planSlot = await db.planSlot.findUnique({
        where: { id: planSlotId },
        include: { weeklyPlan: true },
      });

      if (!planSlot) return notFoundResponse("Slot não encontrado");
      if (planSlot.weeklyPlan.studentId !== studentId) {
        return unauthorizedResponse(
          "Você não pode adicionar treinos a este slot",
        );
      }

      order = planSlot.dayOfWeek;
    } else if (unitId) {
      const unit = await db.unit.findUnique({
        where: { id: unitId },
      });

      if (!unit) return notFoundResponse("Plano não encontrado");

      if (unit.studentId !== studentId) {
        return unauthorizedResponse(
          "Você não pode adicionar treinos a este plano",
        );
      }

      const lastWorkout = await db.workout.findFirst({
        where: { unitId },
        orderBy: { order: "desc" },
      });
      order = lastWorkout ? lastWorkout.order + 1 : 0;
    }

    const workout = await db.workout.create({
      data: {
        unitId: unitId ?? null,
        order,
        ...workoutData,
        muscleGroup: workoutData.muscleGroup || "",
        estimatedTime: workoutData.estimatedTime || 0,
      },
    });

    if (planSlotId) {
      await db.planSlot.update({
        where: { id: planSlotId },
        data: { type: "workout", workoutId: workout.id },
      });
    }

    return successResponse(
      { data: workout, message: "Treino criado com sucesso" },
      201,
    );
  } catch (error) {
    log.error("[gym/workouts/manage] Erro", { error });
    return internalErrorResponse("Erro ao criar treino");
  }
}
