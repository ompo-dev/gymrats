import type { NextRequest } from "@/runtime/next-server";
import { requireStudent } from "@/lib/api/middleware/auth.middleware";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { activateNutritionLibraryPlanSchema } from "@/lib/api/schemas";
import { successResponse } from "@/lib/api/utils/response.utils";
import { activateNutritionLibraryPlanForStudent } from "@/lib/services/nutrition/nutrition-plan.service";
import { mapNutritionRouteError } from "@/lib/services/nutrition/nutrition-route-error";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const validation = await validateBody(
      request,
      activateNutritionLibraryPlanSchema,
    );
    if (!validation.success) {
      return validation.response;
    }

    const data = await activateNutritionLibraryPlanForStudent(
      auth.user.student?.id ?? "",
      validation.data.libraryPlanId,
    );

    return successResponse({
      data,
      message: "Plano alimentar ativado com sucesso",
    });
  } catch (error) {
    console.error("[nutrition/activate] Erro POST:", error);
    return mapNutritionRouteError(error, "Erro ao ativar plano alimentar");
  }
}
