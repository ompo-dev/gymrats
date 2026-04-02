import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { activateNutritionLibraryPlanSchema } from "@/lib/api/schemas";
import {
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { planOperationQueue } from "@/lib/queue/queues";
import { assertPersonalStudentAccess } from "@/lib/services/nutrition/nutrition-access.service";
import { mapNutritionRouteError } from "@/lib/services/nutrition/nutrition-route-error";
import { getPersonalContext } from "@/lib/utils/personal/personal-context";
import type { NextRequest } from "@/runtime/next-server";

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

    const plan = await db.nutritionPlan.findUnique({
      where: { id: validation.data.libraryPlanId },
      select: {
        studentId: true,
        isLibraryTemplate: true,
      },
    });

    if (!plan || !plan.isLibraryTemplate || plan.studentId !== studentId) {
      return notFoundResponse("Plano alimentar nao encontrado");
    }

    const job = await planOperationQueue.add(
      "activate-nutrition-library-plan",
      {
        studentId,
        libraryPlanId: validation.data.libraryPlanId,
      },
    );

    return successResponse(
      {
        jobId: String(job.id),
        status: "queued",
        message: "Ativacao do plano alimentar enviada para processamento",
      },
      202,
    );
  } catch (error) {
    log.error("[personals/students/[id]/nutrition/activate] Erro POST", {
      error: error instanceof Error ? error.message : String(error),
    });
    return mapNutritionRouteError(error, "Erro ao ativar plano alimentar");
  }
}
