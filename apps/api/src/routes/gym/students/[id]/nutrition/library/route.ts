import type { NextRequest } from "@/runtime/next-server";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { createNutritionLibraryPlanSchema } from "@/lib/api/schemas";
import {
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import { assertGymStudentAccess } from "@/lib/services/nutrition/nutrition-access.service";
import {
  createNutritionLibraryPlan,
  listNutritionLibraryPlans,
} from "@/lib/services/nutrition/nutrition-plan.service";
import { mapNutritionRouteError } from "@/lib/services/nutrition/nutrition-route-error";
import { getGymContext } from "@/lib/utils/gym/gym-context";

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

    const data = await listNutritionLibraryPlans(studentId);
    return successResponse({ data });
  } catch (error) {
    console.error("[gym/students/[id]/nutrition/library] Erro GET:", error);
    return mapNutritionRouteError(
      error,
      "Erro ao buscar biblioteca de alimentacao do aluno",
    );
  }
}

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
      createNutritionLibraryPlanSchema,
    );
    if (!validation.success) {
      return validation.response;
    }

    const data = await createNutritionLibraryPlan({
      studentId,
      title: validation.data.title,
      description: validation.data.description,
      meals: validation.data.meals,
      actor: {
        createdById: ctx.gymId,
        creatorType: "GYM",
      },
    });

    return successResponse(
      { data, message: "Plano alimentar criado para o aluno" },
      201,
    );
  } catch (error) {
    console.error("[gym/students/[id]/nutrition/library] Erro POST:", error);
    return mapNutritionRouteError(error, "Erro ao criar plano alimentar");
  }
}
