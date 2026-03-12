import type { NextRequest, NextResponse } from "@/runtime/next-server";
import { validateBody, validateQuery } from "../middleware/validation.middleware";
import {
  dailyNutritionQuerySchema,
  updateDailyNutritionSchema,
} from "../schemas";
import { requireStudent } from "../middleware/auth.middleware";
import {
  badRequestResponse,
  internalErrorResponse,
  successResponse,
} from "../utils/response.utils";
import {
  getActiveNutritionPlan,
  getDailyNutritionForStudent,
  getNutritionLibraryErrorMessage,
  isNutritionLibraryError,
  saveDailyNutritionForStudent,
  updateStudentTargetWater,
} from "@/lib/services/nutrition/nutrition-plan.service";
import { getBrazilNutritionDateKey } from "@/lib/utils/brazil-nutrition-date";

export async function getDailyNutritionHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const queryValidation = await validateQuery(
      request,
      dailyNutritionQuerySchema,
    );
    if (!queryValidation.success) {
      return queryValidation.response;
    }

    let dateKey: string;
    try {
      dateKey = getBrazilNutritionDateKey(queryValidation.data.date);
    } catch {
      return badRequestResponse("Data invalida fornecida");
    }

    const dailyNutrition = await getDailyNutritionForStudent(
      auth.user.student?.id ?? "",
      dateKey,
    );

    return successResponse(
      dailyNutrition as unknown as Record<
        string,
        string | number | boolean | object | null
      >,
    );
  } catch (error) {
    console.error("[getDailyNutritionHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar nutricao", error);
  }
}

export async function updateDailyNutritionHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const validation = await validateBody(request, updateDailyNutritionSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { date, meals, targetWater, waterIntake } = validation.data;
    const studentId = auth.user.student?.id ?? "";

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
      const dailyNutrition = await getDailyNutritionForStudent(studentId, dateKey);
      return successResponse({
        data: dailyNutrition,
        message: "Meta de agua atualizada com sucesso",
      });
    }

    const updatedNutrition = await saveDailyNutritionForStudent({
      studentId,
      dateKey,
      meals,
      waterIntake,
      actor: {
        createdById: studentId,
        creatorType: "STUDENT",
      },
    });

    return successResponse({
      data: updatedNutrition,
      message: "Nutricao atualizada com sucesso",
    });
  } catch (error) {
    console.error("[updateDailyNutritionHandler] Erro:", error);

    if (isNutritionLibraryError(error, "PAST_DATE_READ_ONLY")) {
      return badRequestResponse(getNutritionLibraryErrorMessage(error));
    }

    return internalErrorResponse("Erro ao atualizar nutricao", error);
  }
}

export async function getActiveNutritionPlanHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const activeNutritionPlan = await getActiveNutritionPlan(
      auth.user.student?.id ?? "",
    );

    return successResponse({ data: activeNutritionPlan });
  } catch (error) {
    console.error("[getActiveNutritionPlanHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar plano alimentar ativo", error);
  }
}
