import { pushToDeadLetterQueue, redisConnection } from "@gymrats/cache";
import type { Job } from "bullmq";
import { Worker } from "bullmq";
import { log } from "@/lib/observability/logger";
import {
  processResetPasswordEmailSync,
  processWelcomeEmailSync,
} from "@/lib/services/email.service";

type WelcomeEmailPayload = {
  to: string;
  name: string;
};

type ResetPasswordEmailPayload = {
  to: string;
  name: string;
  code: string;
};

function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

async function handleEmailJob(
  job: Job<WelcomeEmailPayload | ResetPasswordEmailPayload>,
) {
  switch (job.name) {
    case "send-welcome": {
      const payload = job.data as WelcomeEmailPayload;
      await processWelcomeEmailSync(payload.to, payload.name);
      return;
    }
    case "send-reset-password": {
      const payload = job.data as ResetPasswordEmailPayload;
      await processResetPasswordEmailSync(
        payload.to,
        payload.name,
        payload.code,
      );
      return;
    }
    default:
      throw new Error(`Unsupported email job: ${job.name}`);
  }
}

export const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    await handleEmailJob(job);
  },
  {
    connection: redisConnection as never,
    concurrency: 5,
  },
);

emailWorker.on("ready", () => {
  log.info("[worker:email] ready");
});

emailWorker.on("completed", (job) => {
  log.info("[worker:email] completed", {
    jobId: job.id,
    jobName: job.name,
  });
});

emailWorker.on("failed", async (job, error) => {
  const safeError = toError(error);

  log.error("[worker:email] failed", {
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
    await pushToDeadLetterQueue("email-queue", job, safeError);
  }
});
