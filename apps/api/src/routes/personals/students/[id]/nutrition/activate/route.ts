import type { NextRequest } from "@/runtime/next-server";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { activateNutritionLibraryPlanSchema } from "@/lib/api/schemas";
import {
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import { assertPersonalStudentAccess } from "@/lib/services/nutrition/nutrition-access.service";
import { activateNutritionLibraryPlanForStudent } from "@/lib/services/nutrition/nutrition-plan.service";
import { mapNutritionRouteError } from "@/lib/services/nutrition/nutrition-route-error";
import { getPersonalContext } from "@/lib/utils/personal/personal-context";

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

    const validation = await validateBody(
      request,
      activateNutritionLibraryPlanSchema,
    );
    if (!validation.success) {
      return validation.response;
    }

    const data = await activateNutritionLibraryPlanForStudent(
      studentId,
      validation.data.libraryPlanId,
    );

    return successResponse({
      data,
      message: "Plano alimentar ativado com sucesso",
    });
  } catch (error) {
    console.error("[personals/students/[id]/nutrition/activate] Erro POST:", error);
    return mapNutritionRouteError(error, "Erro ao ativar plano alimentar");
  }
}
