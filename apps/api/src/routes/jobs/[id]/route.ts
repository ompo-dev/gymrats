import type { NextRequest } from "@/runtime/next-server";
import { requireAuth } from "@/lib/api/middleware/auth.middleware";
import {
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api/utils/response.utils";
import { planOperationQueue } from "@/lib/queue/queues";

type JobPayload = {
  studentId?: string;
  libraryPlanId?: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request);
  if ("error" in auth) {
    return auth.response;
  }

  const { id } = await params;
  const job = await planOperationQueue.getJob(id);
  if (!job) {
    return notFoundResponse("Job nao encontrado");
  }

  const payload = (job.data ?? {}) as JobPayload;
  if (
    auth.user.role === "STUDENT" &&
    payload.studentId &&
    payload.studentId !== auth.user.student?.id
  ) {
    return unauthorizedResponse("Sem permissao para consultar este job");
  }

  const status = await job.getState();
  return successResponse({
    jobId: String(job.id),
    name: job.name,
    status,
    result: job.returnvalue ?? null,
    error: job.failedReason ?? null,
  });
}
