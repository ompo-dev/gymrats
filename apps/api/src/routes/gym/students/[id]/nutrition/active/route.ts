import {
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import { log } from "@/lib/observability";
import { assertGymStudentAccess } from "@/lib/services/nutrition/nutrition-access.service";
import { getActiveNutritionPlan } from "@/lib/services/nutrition/nutrition-plan.service";
import { mapNutritionRouteError } from "@/lib/services/nutrition/nutrition-route-error";
import { getGymContext } from "@/lib/utils/gym/gym-context";
import type { NextRequest } from "@/runtime/next-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { ctx, errorResponse } = await getGymContext(request);
    if (errorResponse || !ctx) {
      return errorResponse ?? internalErrorResponse("Nao autenticado");
    }

    const { id: studentId } = await params;
    await assertGymStudentAccess(ctx.gymId, studentId);

    const data = await getActiveNutritionPlan(studentId);
    return successResponse({ data });
  } catch (error) {
    log.error("[gym/students/[id]/nutrition/active] Erro GET", {
      error: error instanceof Error ? error.message : String(error),
    });
    return mapNutritionRouteError(
      error,
      "Erro ao buscar plano alimentar ativo do aluno",
    );
  }
}
