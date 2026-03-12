import type { NextRequest } from "@/runtime/next-server";
import { requireStudent } from "@/lib/api/middleware/auth.middleware";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { createNutritionLibraryPlanSchema } from "@/lib/api/schemas";
import {
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import {
  createNutritionLibraryPlan,
  listNutritionLibraryPlans,
} from "@/lib/services/nutrition/nutrition-plan.service";
import { mapNutritionRouteError } from "@/lib/services/nutrition/nutrition-route-error";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const data = await listNutritionLibraryPlans(auth.user.student?.id ?? "");
    return successResponse({ data });
  } catch (error) {
    console.error("[nutrition/library] Erro GET:", error);
    return internalErrorResponse("Erro ao buscar biblioteca de alimentacao", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const validation = await validateBody(
      request,
      createNutritionLibraryPlanSchema,
    );
    if (!validation.success) {
      return validation.response;
    }

    const studentId = auth.user.student?.id ?? "";
    const data = await createNutritionLibraryPlan({
      studentId,
      title: validation.data.title,
      description: validation.data.description,
      meals: validation.data.meals,
      actor: {
        createdById: studentId,
        creatorType: "STUDENT",
      },
    });

    return successResponse(
      { data, message: "Plano alimentar criado na biblioteca" },
      201,
    );
  } catch (error) {
    console.error("[nutrition/library] Erro POST:", error);
    return mapNutritionRouteError(error, "Erro ao criar plano alimentar");
  }
}
