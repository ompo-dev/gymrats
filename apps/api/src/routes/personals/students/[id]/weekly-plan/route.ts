import type { NextRequest } from "@/runtime/next-server";
import {
  badRequestResponse,
  forbiddenResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import { createWeeklyPlanSchema } from "@/lib/api/schemas/workouts.schemas";
import { db } from "@/lib/db";
import { getPersonalContext } from "@/lib/utils/personal/personal-context";
import { getWeeklyPlanUseCase } from "@/lib/use-cases/workouts/get-weekly-plan";

/**
 * GET /api/personals/students/[id]/weekly-plan
 * Retorna o plano semanal do aluno para visualização pelo personal.
 * Requer: usuário logado como personal; aluno deve estar atribuído ao personal.
 * Usa activeWeeklyPlanId (Training Library) - não findUnique por studentId.
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

    const result = await getWeeklyPlanUseCase({
      studentId,
      weekOverride: student?.weekOverride ?? null,
    });

    if (!result.weeklyPlan) {
      return successResponse({
        success: true,
        weeklyPlan: null,
        weekStart: result.weekStart.toISOString(),
        message: "Aluno ainda não possui plano semanal.",
      });
    }

    return successResponse({
      success: true,
      weeklyPlan: result.weeklyPlan,
      weekStart: result.weekStart.toISOString(),
    });
  } catch (error) {
    console.error("[personals/students/[id]/weekly-plan] Erro:", error);
    return internalErrorResponse("Erro ao buscar plano semanal");
  }
}

/**
 * POST /api/personals/students/[id]/weekly-plan
 * Cria o plano semanal do aluno pelo personal.
 */
export async function POST(
  request: NextRequest,
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

    const body = await request.json().catch(() => ({}));
    const validation = createWeeklyPlanSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse(
        "Dados inválidos",
        validation.error.flatten() as Record<string, string | number | boolean | object | null>,
      );
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
    console.error("[personals/students/[id]/weekly-plan] Erro POST:", error);
    return internalErrorResponse("Erro ao criar plano semanal");
  }
}
