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
import { getWeeklyPlanUseCase } from "@/lib/use-cases/workouts/get-weekly-plan";

/**
 * GET /api/gym/students/[id]/weekly-plan
 * Retorna o plano semanal do aluno para visualização pela academia.
 * Requer: usuário logado como gym; aluno deve pertencer à academia.
 * Usa activeWeeklyPlanId (Training Library) - não findUnique por studentId.
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

    const result = await getWeeklyPlanUseCase({
      studentId,
      weekOverride: student?.weekOverride ?? null,
    });

    if (!result.weeklyPlan) {
      return successResponse({
        weeklyPlan: null,
        weekStart: result.weekStart.toISOString(),
        message: "Aluno ainda não possui plano semanal.",
      });
    }

    return successResponse({
      weeklyPlan: result.weeklyPlan,
      weekStart: result.weekStart.toISOString(),
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

    const studentData = await db.student.findUnique({
      where: { id: studentId },
      select: { activeWeeklyPlanId: true },
    });

    if (studentData?.activeWeeklyPlanId) {
      const existing = await db.weeklyPlan.findUnique({
        where: { id: studentData.activeWeeklyPlanId },
        include: { slots: { orderBy: { dayOfWeek: "asc" } } },
      });
      if (existing) {
        return successResponse({
          data: existing,
          message: "Plano semanal já existe",
        });
      }
    }

    const { title } = validation.data;

    const weeklyPlan = await db.weeklyPlan.create({
      data: {
        studentId,
        title: title || "Meu Plano Semanal",
        isLibraryTemplate: false,
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

    await db.student.update({
      where: { id: studentId },
      data: { activeWeeklyPlanId: weeklyPlan.id },
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

    const studentData = await db.student.findUnique({
      where: { id: studentId },
      select: { activeWeeklyPlanId: true },
    });

    let weeklyPlan =
      studentData?.activeWeeklyPlanId
        ? await db.weeklyPlan.findUnique({
            where: { id: studentData.activeWeeklyPlanId },
            include: { slots: { orderBy: { dayOfWeek: "asc" } } },
          })
        : null;

    if (!weeklyPlan) {
      weeklyPlan = await db.weeklyPlan.create({
        data: {
          studentId,
          title: validation.data.title || "Meu Plano Semanal",
          isLibraryTemplate: false,
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
      await db.student.update({
        where: { id: studentId },
        data: { activeWeeklyPlanId: weeklyPlan.id },
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
