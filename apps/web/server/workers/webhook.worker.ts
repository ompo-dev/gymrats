import { Worker } from "bullmq";
import { redisConnection } from "@/lib/queue/redis";
import { log } from "@/lib/observability";
import { WebhookService } from "@/lib/services/webhook.service";

export const webhookWorker = new Worker(
  "webhook-queue",
  async (job) => {
    switch (job.name) {
      case "process-payment": {
        log.info(`[Webhook Worker] Iniciando processamento de pagamento longo: ${job.id}`);
        const { event, data } = job.data;
        await WebhookService.processAbacatePayEvent(event, data);
        log.info(`[Webhook Worker] Sucesso ao processar pagamento: ${job.id}`);
        break;
      }
      default:
        log.warn(`[Webhook Worker] Tipo de job não reconhecido (webhook-queue): ${job.name}`);
    }
  },
  {
    connection: redisConnection as any,
    concurrency: 2, // Processar até 2 webhooks em paralelo, pois envolve transações intensas de DB
  }
);

webhookWorker.on("completed", (job) => {
  log.info(`[Webhook Worker] Job completed ${job.id} (${job.name})`);
});

webhookWorker.on("failed", (job, err) => {
  log.error(`[Webhook Worker] Job failed ${job?.id} (${job?.name})`, { error: err.message });
});
