import { requireStudent } from "@/lib/api/middleware/auth.middleware";
import { activateLibraryPlanSchema } from "@/lib/api/schemas/workouts.schemas";
import {
  badRequestResponse,
  notFoundResponse,
  internalErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api/utils/response.utils";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { activateTrainingLibraryPlanForStudent } from "@/lib/services/workouts/training-library-activation.service";
import type { NextRequest } from "@/runtime/next-server";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student?.id;
    if (!studentId) {
      return unauthorizedResponse("Student nao encontrado");
    }

    const body = await request.json().catch(() => ({}));
    const validation = activateLibraryPlanSchema.safeParse(body);
    if (!validation.success) {
      return badRequestResponse("Dados invalidos", validation.error.flatten());
    }

    const { libraryPlanId } = validation.data;
    const masterPlan = await db.weeklyPlan.findUnique({
      where: { id: libraryPlanId },
      select: {
        studentId: true,
        isLibraryTemplate: true,
      },
    });

    if (!masterPlan || !masterPlan.isLibraryTemplate) {
      return notFoundResponse("Plano da biblioteca nao encontrado");
    }

    if (masterPlan.studentId !== studentId) {
      return unauthorizedResponse("Voce nao tem acesso a este plano");
    }

    const weeklyPlan = await activateTrainingLibraryPlanForStudent(
      studentId,
      libraryPlanId,
    );

    return successResponse(
      {
        data: weeklyPlan,
        message: "Plano ativado com sucesso",
      },
      200,
    );
  } catch (error) {
    log.error("[workouts/weekly-plan/activate] Erro POST", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse("Erro ao ativar plano da biblioteca");
  }
}
