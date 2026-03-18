process.env.GYMRATS_RUNTIME_ROLE ??= "worker";

import { redisConnection } from "@gymrats/cache";
import { log } from "@/lib/observability/logger";
import { emailWorker } from "./email.worker";
import { planOperationsWorker } from "./plan-operations.worker";
import { webhookWorker } from "./webhook.worker";

let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  log.info("[worker] shutting down", { signal });

  try {
    await Promise.all([
      emailWorker.close(),
      webhookWorker.close(),
      planOperationsWorker.close(),
    ]);
    await redisConnection.quit();
    log.info("[worker] shutdown complete", { signal });
  } catch (error) {
    log.error("[worker] shutdown failed", {
      signal,
      error: error instanceof Error ? error.message : String(error),
    });
    process.exitCode = 1;
  }
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void shutdown(signal);
  });
}

try {
  await Promise.all([
    emailWorker.waitUntilReady(),
    webhookWorker.waitUntilReady(),
    planOperationsWorker.waitUntilReady(),
  ]);
  log.info("[worker] Email, webhook and plan workers are running");
} catch (error) {
  log.error("[worker] startup failed", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
}
