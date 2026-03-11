import type { Job } from "bullmq";
import { Worker } from "bullmq";
import { pushToDeadLetterQueue, redisConnection } from "@gymrats/cache";
import { log } from "@/lib/observability/logger";
import { WebhookService } from "@/lib/services/webhook.service";

type WebhookJobPayload = {
  event: string;
  data: Record<string, unknown>;
};

function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

function assertWebhookPayload(
  payload: unknown,
): asserts payload is WebhookJobPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Webhook payload is missing");
  }

  const event = Reflect.get(payload, "event");
  if (typeof event !== "string" || event.trim().length === 0) {
    throw new Error("Webhook payload event is invalid");
  }
}

async function handleWebhookJob(job: Job<WebhookJobPayload>) {
  if (job.name !== "process-payment") {
    throw new Error(`Unsupported webhook job: ${job.name}`);
  }

  assertWebhookPayload(job.data);
  await WebhookService.processAbacatePayEvent(job.data.event, job.data.data);
}

export const webhookWorker = new Worker(
  "webhook-queue",
  async (job) => {
    await handleWebhookJob(job);
  },
  {
    connection: redisConnection as never,
    concurrency: 10,
  },
);

webhookWorker.on("ready", () => {
  log.info("[worker:webhook] ready");
});

webhookWorker.on("completed", (job) => {
  log.info("[worker:webhook] completed", {
    jobId: job.id,
    jobName: job.name,
  });
});

webhookWorker.on("failed", async (job, error) => {
  const safeError = toError(error);

  log.error("[worker:webhook] failed", {
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
    await pushToDeadLetterQueue("webhook-queue", job, safeError);
  }
});
