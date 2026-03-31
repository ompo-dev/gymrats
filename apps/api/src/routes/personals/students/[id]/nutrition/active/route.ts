import {
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import { assertPersonalStudentAccess } from "@/lib/services/nutrition/nutrition-access.service";
import { getActiveNutritionPlan } from "@/lib/services/nutrition/nutrition-plan.service";
import { mapNutritionRouteError } from "@/lib/services/nutrition/nutrition-route-error";
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

    const data = await getActiveNutritionPlan(studentId);
    return successResponse({ data });
  } catch (error) {
    console.error(
      "[personals/students/[id]/nutrition/active] Erro GET:",
      error,
    );
    return mapNutritionRouteError(
      error,
      "Erro ao buscar plano alimentar ativo do aluno",
    );
  }
}
