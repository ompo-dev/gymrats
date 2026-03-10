import { Worker } from "bullmq";
import { redisConnection } from "@/lib/queue/redis";
import { log } from "@/lib/observability";
import { processWelcomeEmailSync, processResetPasswordEmailSync } from "@/lib/services/email.service";

export const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    switch (job.name) {
      case "send-welcome": {
        log.info(`[Worker] Iniciando envio de boas-vindas: ${job.id}`);
        const { to, name } = job.data;
        await processWelcomeEmailSync(to, name);
        log.info(`[Worker] Sucesso envio boas-vindas: ${job.id}`);
        break;
      }
      case "send-reset-password": {
        log.info(`[Worker] Iniciando envio de reset senha: ${job.id}`);
        const { to, name, code } = job.data;
        await processResetPasswordEmailSync(to, name, code);
        log.info(`[Worker] Sucesso envio reset senha: ${job.id}`);
        break;
      }
      default:
        log.warn(`[Worker] Tipo de job não reconhecido (email-queue): ${job.name}`);
    }
  },
  {
    connection: redisConnection as any,
    concurrency: 5, // Processa até 5 emails simultaneamente
  }
);

emailWorker.on("completed", (job) => {
  log.info(`[Email Worker] Job completed ${job.id} (${job.name})`);
});

emailWorker.on("failed", (job, err) => {
  log.error(`[Email Worker] Job failed ${job?.id} (${job?.name})`, { error: err.message });
});
