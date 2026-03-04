import type { NextRequest } from "next/server";
import {
  badRequestResponse,
  forbiddenResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import {
  createWeeklyPlanSchema,
  updateWeeklyPlanSchema,
} from "@/lib/api/schemas/workouts.schemas";
import { db } from "@/lib/db";
import { getGymContext } from "@/lib/utils/gym/gym-context";
import { addDays, getWeekStart } from "@/lib/utils/week";

/**
 * GET /api/gym/students/[id]/weekly-plan
 * Retorna o plano semanal do aluno para visualização pela academia.
 * Requer: usuário logado como gym; aluno deve pertencer à academia.
 */
export async function GET(
  _request: NextRequest,
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

    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { weekOverride: true },
    });

    const weekStart = getWeekStart(student?.weekOverride ?? null);
    const weekEnd = addDays(weekStart, 7);

    const weeklyPlan = await db.weeklyPlan.findUnique({
      where: { studentId },
      include: {
        slots: {
          orderBy: { dayOfWeek: "asc" },
          include: {
            workout: {
              include: {
                exercises: {
                  orderBy: { order: "asc" },
                  include: {
                    alternatives: { orderBy: { order: "asc" } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!weeklyPlan) {
      return successResponse({
        weeklyPlan: null,
        weekStart: weekStart.toISOString(),
        message: "Aluno ainda não possui plano semanal.",
      });
    }

    const completionsThisWeek = await db.workoutHistory.findMany({
      where: {
        studentId,
        date: { gte: weekStart, lt: weekEnd },
        workoutId: { not: null },
      },
      select: { workoutId: true, overallFeedback: true, date: true },
    });

    const completedByWorkoutId = new Map(
      completionsThisWeek.map((c) => [
        c.workoutId!,
        { feedback: c.overallFeedback, date: c.date },
      ]),
    );

    const formattedSlots = weeklyPlan.slots.map((slot, index) => {
      const isRest = slot.type === "rest";
      const completed = isRest
        ? true
        : slot.workoutId
          ? completedByWorkoutId.has(slot.workoutId)
          : false;

      const prevSlot = index > 0 ? weeklyPlan?.slots[index - 1] : null;
      const prevCompleted =
        !prevSlot || prevSlot.type === "rest"
          ? true
          : prevSlot.workoutId
            ? completedByWorkoutId.has(prevSlot.workoutId)
            : false;

      const locked = isRest ? false : !prevCompleted;

      const completion = slot.workoutId
        ? completedByWorkoutId.get(slot.workoutId)
        : null;
      let stars: number | undefined;
      if (completion?.feedback) {
        stars =
          completion.feedback === "excelente"
            ? 3
            : completion.feedback === "bom"
              ? 2
              : completion.feedback === "regular"
                ? 1
                : 0;
      }

      if (isRest) {
        return {
          id: slot.id,
          dayOfWeek: slot.dayOfWeek,
          type: "rest" as const,
          locked: false,
          completed: true,
        };
      }

      const workout = slot.workout;
      if (!workout) {
        return {
          id: slot.id,
          dayOfWeek: slot.dayOfWeek,
          type: "rest" as const,
          locked: false,
          completed: true,
        };
      }

      return {
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        type: "workout" as const,
        workout: {
          id: workout.id,
          title: workout.title,
          description: workout.description || "",
          type: workout.type as "strength" | "cardio" | "flexibility" | "rest",
          muscleGroup: workout.muscleGroup,
          difficulty: workout.difficulty as
            | "iniciante"
            | "intermediario"
            | "avancado",
          exercises: workout.exercises.map((ex) => ({
            id: ex.id,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            rest: ex.rest,
            notes: ex.notes || undefined,
            videoUrl: ex.videoUrl || undefined,
            educationalId: ex.educationalId || undefined,
            primaryMuscles: ex.primaryMuscles
              ? JSON.parse(ex.primaryMuscles)
              : undefined,
            secondaryMuscles: ex.secondaryMuscles
              ? JSON.parse(ex.secondaryMuscles)
              : undefined,
            difficulty: ex.difficulty || undefined,
            equipment: ex.equipment ? JSON.parse(ex.equipment) : undefined,
            instructions: ex.instructions
              ? JSON.parse(ex.instructions)
              : undefined,
            tips: ex.tips ? JSON.parse(ex.tips) : undefined,
            commonMistakes: ex.commonMistakes
              ? JSON.parse(ex.commonMistakes)
              : undefined,
            benefits: ex.benefits ? JSON.parse(ex.benefits) : undefined,
            scientificEvidence: ex.scientificEvidence || undefined,
            alternatives:
              ex.alternatives.length > 0
                ? ex.alternatives.map((alt) => ({
                    id: alt.id,
                    name: alt.name,
                    reason: alt.reason,
                    educationalId: alt.educationalId || undefined,
                  }))
                : undefined,
          })),
          xpReward: workout.xpReward,
          estimatedTime: workout.estimatedTime,
          locked,
          completed,
          stars,
          completedAt: completion?.date || undefined,
        },
        locked,
        completed,
        stars,
        completedAt: completion?.date || undefined,
      };
    });

    return successResponse({
      weeklyPlan: {
        id: weeklyPlan.id,
        title: weeklyPlan.title,
        description: weeklyPlan.description ?? null,
        slots: formattedSlots,
      },
      weekStart: weekStart.toISOString(),
    });
  } catch (error) {
    console.error("[gym/students/[id]/weekly-plan] Erro:", error);
    return internalErrorResponse("Erro ao buscar plano semanal");
  }
}

/**
 * POST /api/gym/students/[id]/weekly-plan
 * Cria o plano semanal do aluno pela academia.
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

    const body = await request.json().catch(() => ({}));
    const validation = createWeeklyPlanSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse("Dados inválidos", validation.error);
    }

    const existing = await db.weeklyPlan.findUnique({
      where: { studentId },
    });

    if (existing) {
      return successResponse({
        data: existing,
        message: "Plano semanal já existe",
      });
    }

    const { title } = validation.data;

    const weeklyPlan = await db.weeklyPlan.create({
      data: {
        studentId,
        title: title || "Meu Plano Semanal",
        slots: {
          create: Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
            type: "rest",
            order: i,
          })),
        },
      },
      include: { slots: { orderBy: { dayOfWeek: "asc" } } },
    });

    return successResponse(
      { data: weeklyPlan, message: "Plano semanal criado com sucesso" },
      201,
    );
  } catch (error) {
    console.error("[gym/students/[id]/weekly-plan] Erro POST:", error);
    return internalErrorResponse("Erro ao criar plano semanal");
  }
}

/**
 * PATCH /api/gym/students/[id]/weekly-plan
 * Atualiza o plano semanal do aluno pela academia.
 */
export async function PATCH(
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

    const body = await request.json().catch(() => ({}));
    const validation = updateWeeklyPlanSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse("Dados inválidos", validation.error);
    }

    let weeklyPlan = await db.weeklyPlan.findUnique({
      where: { studentId },
      include: { slots: { orderBy: { dayOfWeek: "asc" } } },
    });

    if (!weeklyPlan) {
      weeklyPlan = await db.weeklyPlan.create({
        data: {
          studentId,
          title: validation.data.title || "Meu Plano Semanal",
          slots: {
            create: Array.from({ length: 7 }, (_, i) => ({
              dayOfWeek: i,
              type: "rest",
              order: i,
            })),
          },
        },
        include: { slots: { orderBy: { dayOfWeek: "asc" } } },
      });
    }

    if (
      validation.data.title !== undefined ||
      validation.data.description !== undefined
    ) {
      weeklyPlan = await db.weeklyPlan.update({
        where: { id: weeklyPlan.id },
        data: {
          ...(validation.data.title !== undefined && {
            title: validation.data.title,
          }),
          ...(validation.data.description !== undefined && {
            description: validation.data.description,
          }),
        },
        include: { slots: { orderBy: { dayOfWeek: "asc" } } },
      });
    }

    if (validation.data.slots) {
      for (const slotData of validation.data.slots) {
        await db.planSlot.upsert({
          where: {
            weeklyPlanId_dayOfWeek: {
              weeklyPlanId: weeklyPlan.id,
              dayOfWeek: slotData.dayOfWeek,
            },
          },
          create: {
            weeklyPlanId: weeklyPlan.id,
            dayOfWeek: slotData.dayOfWeek,
            type: slotData.type,
            workoutId: slotData.workoutId ?? null,
            order: slotData.dayOfWeek,
          },
          update: {
            type: slotData.type,
            workoutId: slotData.workoutId ?? null,
          },
        });
      }
    }

    const updated = await db.weeklyPlan.findUnique({
      where: { id: weeklyPlan.id },
      include: { slots: { orderBy: { dayOfWeek: "asc" } } },
    });

    return successResponse({
      data: updated,
      message: "Plano semanal atualizado com sucesso",
    });
  } catch (error) {
    console.error("[gym/students/[id]/weekly-plan] Erro PATCH:", error);
    return internalErrorResponse("Erro ao atualizar plano semanal");
  }
}
