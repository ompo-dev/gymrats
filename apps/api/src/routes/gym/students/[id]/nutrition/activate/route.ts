import type { NextRequest } from "@/runtime/next-server";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { activateNutritionLibraryPlanSchema } from "@/lib/api/schemas";
import {
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import { assertGymStudentAccess } from "@/lib/services/nutrition/nutrition-access.service";
import { activateNutritionLibraryPlanForStudent } from "@/lib/services/nutrition/nutrition-plan.service";
import { mapNutritionRouteError } from "@/lib/services/nutrition/nutrition-route-error";
import { getGymContext } from "@/lib/utils/gym/gym-context";

export async function POST(
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
    console.error("[gym/students/[id]/nutrition/activate] Erro POST:", error);
    return mapNutritionRouteError(error, "Erro ao ativar plano alimentar");
  }
}
