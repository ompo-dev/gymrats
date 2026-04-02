import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { updateDailyNutritionSchema } from "@/lib/api/schemas";
import {
  badRequestResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import { assertPersonalStudentAccess } from "@/lib/services/nutrition/nutrition-access.service";
import {
  getDailyNutritionForStudent,
  saveDailyNutritionForStudent,
  updateStudentTargetWater,
} from "@/lib/services/nutrition/nutrition-plan.service";
import { mapNutritionRouteError } from "@/lib/services/nutrition/nutrition-route-error";
import { log } from "@/lib/observability";
import { getBrazilNutritionDateKey } from "@/lib/utils/brazil-nutrition-date";
import { getPersonalContext } from "@/lib/utils/personal/personal-context";
import type { NextRequest } from "@/runtime/next-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { ctx, errorResponse } = await getPersonalContext(request);
    if (errorResponse || !ctx) {
      return errorResponse ?? internalErrorResponse("Nao autenticado");
    }

    const { id: studentId } = await params;
    await assertPersonalStudentAccess(ctx.personalId, studentId);

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") ?? undefined;

    let dateKey: string;
    try {
      dateKey = getBrazilNutritionDateKey(dateParam);
    } catch {
      return badRequestResponse("Data invalida fornecida");
    }

    const dailyNutrition = await getDailyNutritionForStudent(
      studentId,
      dateKey,
      {
        fresh: searchParams.get("fresh") === "1",
      },
    );
    return successResponse(
      dailyNutrition as unknown as Record<
        string,
        string | number | boolean | object | null
      >,
    );
  } catch (error) {
    log.error("[personals/students/[id]/nutrition] Erro GET", {
      error: error instanceof Error ? error.message : String(error),
    });
    return mapNutritionRouteError(error, "Erro ao buscar nutricao");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { ctx, errorResponse } = await getPersonalContext(request);
    if (errorResponse || !ctx) {
      return errorResponse ?? internalErrorResponse("Nao autenticado");
    }

    const { id: studentId } = await params;
    await assertPersonalStudentAccess(ctx.personalId, studentId);

    const validation = await validateBody(request, updateDailyNutritionSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { date, meals, syncPlan, targetWater, waterIntake } = validation.data;

    if (targetWater !== undefined) {
      await updateStudentTargetWater(studentId, targetWater);
    }

    let dateKey: string;
    try {
      dateKey = getBrazilNutritionDateKey(date);
    } catch {
      return badRequestResponse("Data invalida fornecida");
    }

    if (meals === undefined && waterIntake === undefined) {
      const dailyNutrition = await getDailyNutritionForStudent(
        studentId,
        dateKey,
        {
          fresh: true,
        },
      );
      return successResponse({
        data: dailyNutrition,
        message: "Meta de agua atualizada com sucesso",
      });
    }

    const dailyNutrition = await saveDailyNutritionForStudent({
      studentId,
      dateKey,
      meals,
      syncPlan,
      waterIntake,
      actor: {
        createdById: ctx.personalId,
        creatorType: "PERSONAL",
      },
    });

    return successResponse({
      data: dailyNutrition,
      message: "Nutricao atualizada com sucesso",
    });
  } catch (error) {
    log.error("[personals/students/[id]/nutrition] Erro POST", {
      error: error instanceof Error ? error.message : String(error),
    });
    return mapNutritionRouteError(error, "Erro ao atualizar nutricao");
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return POST(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return POST(request, context);
}
