import { pushToDeadLetterQueue, redisConnection } from "@gymrats/cache";
import type { Job } from "bullmq";
import { Worker } from "bullmq";
import { log } from "@/lib/observability/logger";
import { activateNutritionLibraryPlanForStudent } from "@/lib/services/nutrition/nutrition-plan.service";
import { activateTrainingLibraryPlanForStudent } from "@/lib/services/workouts/training-library-activation.service";

type ActivatePlanPayload = {
  studentId: string;
  libraryPlanId: string;
};

function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

async function handlePlanOperation(job: Job<ActivatePlanPayload>) {
  switch (job.name) {
    case "activate-training-library-plan":
      return activateTrainingLibraryPlanForStudent(
        job.data.studentId,
        job.data.libraryPlanId,
      );
    case "activate-nutrition-library-plan":
      return activateNutritionLibraryPlanForStudent(
        job.data.studentId,
        job.data.libraryPlanId,
      );
    default:
      throw new Error(`Unsupported plan operation job: ${job.name}`);
  }
}

export const planOperationsWorker = new Worker(
  "plan-operation-queue",
  async (job) => handlePlanOperation(job),
  {
    connection: redisConnection as never,
    concurrency: 4,
  },
);

planOperationsWorker.on("ready", () => {
  log.info("[worker:plan-operations] ready");
});

planOperationsWorker.on("completed", (job) => {
  log.info("[worker:plan-operations] completed", {
    jobId: job.id,
    jobName: job.name,
  });
});

planOperationsWorker.on("failed", async (job, error) => {
  const safeError = toError(error);

  log.error("[worker:plan-operations] failed", {
    jobId: job?.id,
    jobName: job?.name,
    attemptsMade: job?.attemptsMade,
    error: safeError.message,
  });

  if (!job) {
    return;
  }

  const maxAttempts = job.opts.attempts ?? 1;
  if (job.attemptsMade >= maxAttempts) {
    await pushToDeadLetterQueue("plan-operation-queue", job, safeError);
  }
});
