import type { NextRequest } from "next/server";
import {
  forbiddenResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import { db } from "@/lib/db";
import { getPersonalContext } from "@/lib/utils/personal/personal-context";
import { addDays, getWeekStart } from "@/lib/utils/week";

/**
 * GET /api/personals/students/[id]/weekly-plan
 * Retorna o plano semanal do aluno para visualização pelo personal.
 * Requer: usuário logado como personal; aluno deve estar atribuído ao personal.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { ctx, errorResponse } = await getPersonalContext();
    if (errorResponse || !ctx) {
      return errorResponse ?? internalErrorResponse("Não autenticado");
    }

    const { id: studentId } = await params;

    const assignment = await db.studentPersonalAssignment.findFirst({
      where: {
        studentId,
        personalId: ctx.personalId,
        status: "active",
      },
    });
    if (!assignment) {
      return forbiddenResponse(
        "Aluno não encontrado ou não está atribuído a você",
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
        success: true,
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
              : 1;
      }

      return {
        ...slot,
        completed,
        locked,
        stars,
      };
    });

    return successResponse({
      success: true,
      weeklyPlan: {
        ...weeklyPlan,
        slots: formattedSlots,
      },
      weekStart: weekStart.toISOString(),
    });
  } catch (error) {
    console.error("[personals/students/[id]/weekly-plan] Erro:", error);
    return internalErrorResponse("Erro ao buscar plano semanal");
  }
}
