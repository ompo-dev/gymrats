import { pushToDeadLetterQueue, redisConnection } from "@gymrats/cache";
import type { Job } from "bullmq";
import { Worker } from "bullmq";
import {
  AccessService,
  type AccessEventQueuePayload,
} from "@/lib/services/access/access.service";
import { log } from "@/lib/observability/logger";

function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

function assertAccessPayload(
  payload: unknown,
): asserts payload is AccessEventQueuePayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Access event payload is missing");
  }

  const rawEventId = Reflect.get(payload, "rawEventId");
  if (typeof rawEventId !== "string" || rawEventId.trim().length === 0) {
    throw new Error("Access event rawEventId is invalid");
  }
}

async function handleAccessJob(job: Job<AccessEventQueuePayload>) {
  if (job.name !== "process-access-event") {
    throw new Error(`Unsupported access job: ${job.name}`);
  }

  assertAccessPayload(job.data);
  await AccessService.processRawEvent(job.data.rawEventId);
}

export const accessWorker = new Worker(
  "access-event-queue",
  async (job) => {
    await handleAccessJob(job);
  },
  {
    connection: redisConnection as never,
    concurrency: 10,
  },
);

accessWorker.on("ready", () => {
  log.info("[worker:access] ready");
});

accessWorker.on("completed", (job) => {
  log.info("[worker:access] completed", {
    jobId: job.id,
    jobName: job.name,
  });
});

accessWorker.on("failed", async (job, error) => {
  const safeError = toError(error);

  log.error("[worker:access] failed", {
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
    await pushToDeadLetterQueue("access-event-queue", job, safeError);
  }
});
