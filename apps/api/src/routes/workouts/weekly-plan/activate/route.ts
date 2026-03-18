import type { NextRequest } from "@/runtime/next-server";
import { requireStudent } from "@/lib/api/middleware/auth.middleware";
import { activateLibraryPlanSchema } from "@/lib/api/schemas/workouts.schemas";
import {
  badRequestResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api/utils/response.utils";
import { db } from "@/lib/db";
import { planOperationQueue } from "@/lib/queue/queues";

export async function POST(request: NextRequest) {
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
    return badRequestResponse("Dados invalidos", validation.error.flatten() as any);
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

  const job = await planOperationQueue.add("activate-training-library-plan", {
    studentId,
    libraryPlanId,
  });

  return successResponse(
    {
      jobId: String(job.id),
      status: "queued",
      message: "Ativacao do plano enviada para processamento",
    },
    202,
  );
}
