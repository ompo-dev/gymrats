import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { createNutritionLibraryPlanSchema } from "@/lib/api/schemas";
import {
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import { assertPersonalStudentAccess } from "@/lib/services/nutrition/nutrition-access.service";
import { listNutritionLibraryPlans } from "@/lib/services/nutrition/nutrition-library-read.service";
import { createNutritionLibraryPlan } from "@/lib/services/nutrition/nutrition-plan.service";
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

    const url = new URL(request.url);
    const data = await listNutritionLibraryPlans(studentId, {
      fresh: url.searchParams.get("fresh") === "1",
    });
    return successResponse({ data });
  } catch (error) {
    console.error(
      "[personals/students/[id]/nutrition/library] Erro GET:",
      error,
    );
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
    const { ctx, errorResponse } = await getPersonalContext(request);
    if (errorResponse || !ctx) {
      return errorResponse ?? internalErrorResponse("Nao autenticado");
    }

    const { id: studentId } = await params;
    await assertPersonalStudentAccess(ctx.personalId, studentId);

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
        createdById: ctx.personalId,
        creatorType: "PERSONAL",
      },
    });

    return successResponse(
      { data, message: "Plano alimentar criado para o aluno" },
      201,
    );
  } catch (error) {
    console.error(
      "[personals/students/[id]/nutrition/library] Erro POST:",
      error,
    );
    return mapNutritionRouteError(error, "Erro ao criar plano alimentar");
  }
}
