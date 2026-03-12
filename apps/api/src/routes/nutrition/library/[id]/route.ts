import type { NextRequest } from "@/runtime/next-server";
import { requireStudent } from "@/lib/api/middleware/auth.middleware";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { updateNutritionLibraryPlanSchema } from "@/lib/api/schemas";
import { successResponse } from "@/lib/api/utils/response.utils";
import { assertStudentCanManageNutritionLibraryPlan } from "@/lib/services/nutrition/nutrition-access.service";
import {
  deleteNutritionLibraryPlan,
  updateNutritionLibraryPlan,
} from "@/lib/services/nutrition/nutrition-plan.service";
import { mapNutritionRouteError } from "@/lib/services/nutrition/nutrition-route-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const { id } = await params;
    await assertStudentCanManageNutritionLibraryPlan(
      auth.user.student?.id ?? "",
      id,
    );

    const validation = await validateBody(
      request,
      updateNutritionLibraryPlanSchema,
    );
    if (!validation.success) {
      return validation.response;
    }

    const data = await updateNutritionLibraryPlan(id, validation.data);
    return successResponse({
      data,
      message: "Plano alimentar atualizado com sucesso",
    });
  } catch (error) {
    console.error("[nutrition/library/[id]] Erro PATCH:", error);
    return mapNutritionRouteError(error, "Erro ao atualizar plano alimentar");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const { id } = await params;
    await assertStudentCanManageNutritionLibraryPlan(
      auth.user.student?.id ?? "",
      id,
    );

    await deleteNutritionLibraryPlan(id);
    return successResponse({ message: "Plano alimentar removido com sucesso" });
  } catch (error) {
    console.error("[nutrition/library/[id]] Erro DELETE:", error);
    return mapNutritionRouteError(error, "Erro ao remover plano alimentar");
  }
}
