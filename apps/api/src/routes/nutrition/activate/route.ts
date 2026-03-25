import { requireStudent } from "@/lib/api/middleware/auth.middleware";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { activateNutritionLibraryPlanSchema } from "@/lib/api/schemas";
import {
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api/utils/response.utils";
import { db } from "@/lib/db";
import { planOperationQueue } from "@/lib/queue/queues";
import { mapNutritionRouteError } from "@/lib/services/nutrition/nutrition-route-error";
import type { NextRequest } from "@/runtime/next-server";

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

    const studentId = auth.user.student?.id ?? "";
    const plan = await db.nutritionPlan.findUnique({
      where: { id: validation.data.libraryPlanId },
      select: {
        studentId: true,
        isLibraryTemplate: true,
      },
    });

    if (!plan || !plan.isLibraryTemplate) {
      return notFoundResponse("Plano alimentar nao encontrado");
    }

    if (plan.studentId !== studentId) {
      return unauthorizedResponse("Voce nao tem acesso a este plano alimentar");
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
    console.error("[nutrition/activate] Erro POST:", error);
    return mapNutritionRouteError(error, "Erro ao ativar plano alimentar");
  }
}
