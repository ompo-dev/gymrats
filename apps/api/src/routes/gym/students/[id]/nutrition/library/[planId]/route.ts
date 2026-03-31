import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { updateNutritionLibraryPlanSchema } from "@/lib/api/schemas";
import {
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import {
  assertGymCanManageNutritionLibraryPlan,
  assertGymStudentAccess,
} from "@/lib/services/nutrition/nutrition-access.service";
import { getNutritionLibraryPlanDetail } from "@/lib/services/nutrition/nutrition-library-read.service";
import {
  deleteNutritionLibraryPlan,
  updateNutritionLibraryPlan,
} from "@/lib/services/nutrition/nutrition-plan.service";
import { mapNutritionRouteError } from "@/lib/services/nutrition/nutrition-route-error";
import { getGymContext } from "@/lib/utils/gym/gym-context";
import type { NextRequest } from "@/runtime/next-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; planId: string }> },
) {
  try {
    const { ctx, errorResponse } = await getGymContext(request);
    if (errorResponse || !ctx) {
      return errorResponse ?? internalErrorResponse("Nao autenticado");
    }

    const { id: studentId, planId } = await params;
    await assertGymStudentAccess(ctx.gymId, studentId);
    const plan = await assertGymCanManageNutritionLibraryPlan(
      ctx.gymId,
      planId,
    );
    if (plan.studentId !== studentId) {
      return forbiddenResponse("Plano alimentar nao pertence a este aluno");
    }

    const url = new URL(request.url);
    const data = await getNutritionLibraryPlanDetail(planId, {
      fresh: url.searchParams.get("fresh") === "1",
    });
    if (!data) {
      return notFoundResponse("Plano alimentar nao encontrado");
    }

    return successResponse({ data });
  } catch (error) {
    console.error(
      "[gym/students/[id]/nutrition/library/[planId]] Erro GET:",
      error,
    );
    return mapNutritionRouteError(error, "Erro ao buscar plano alimentar");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; planId: string }> },
) {
  try {
    const { ctx, errorResponse } = await getGymContext(request);
    if (errorResponse || !ctx) {
      return errorResponse ?? internalErrorResponse("Nao autenticado");
    }

    const { id: studentId, planId } = await params;
    await assertGymStudentAccess(ctx.gymId, studentId);
    const plan = await assertGymCanManageNutritionLibraryPlan(
      ctx.gymId,
      planId,
    );

    if (plan.studentId !== studentId) {
      return forbiddenResponse("Plano alimentar nao pertence a este aluno");
    }

    const validation = await validateBody(
      request,
      updateNutritionLibraryPlanSchema,
    );
    if (!validation.success) {
      return validation.response;
    }

    const data = await updateNutritionLibraryPlan(planId, validation.data);
    return successResponse({
      data,
      message: "Plano alimentar atualizado com sucesso",
    });
  } catch (error) {
    console.error(
      "[gym/students/[id]/nutrition/library/[planId]] Erro PATCH:",
      error,
    );
    return mapNutritionRouteError(error, "Erro ao atualizar plano alimentar");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; planId: string }> },
) {
  try {
    const { ctx, errorResponse } = await getGymContext(request);
    if (errorResponse || !ctx) {
      return errorResponse ?? internalErrorResponse("Nao autenticado");
    }

    const { id: studentId, planId } = await params;
    await assertGymStudentAccess(ctx.gymId, studentId);
    const plan = await assertGymCanManageNutritionLibraryPlan(
      ctx.gymId,
      planId,
    );

    if (plan.studentId !== studentId) {
      return forbiddenResponse("Plano alimentar nao pertence a este aluno");
    }

    await deleteNutritionLibraryPlan(planId);
    return successResponse({ message: "Plano alimentar removido com sucesso" });
  } catch (error) {
    console.error(
      "[gym/students/[id]/nutrition/library/[planId]] Erro DELETE:",
      error,
    );
    return mapNutritionRouteError(error, "Erro ao remover plano alimentar");
  }
}
