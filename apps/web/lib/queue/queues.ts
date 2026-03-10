import { Queue } from "bullmq";
import { redisConnection } from "./redis";

// Configuração padrão para as filas (reaproveitamento da conexão e tempo exato de retentativa)
const defaultQueueOptions = {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // Começa tentando novamente após 5 segundos, depois 25s, etc.
    },
    removeOnComplete: true, // Libera memória apagando jobs concluídos
    removeOnFail: 1000, // Limita histórico de jobs falhos a 1000 logs
  },
};

// --- DECLARAÇÃO DAS FILAS ---

// 1. Fila de Emails (Welcome, Reset Password)
export const emailQueue = new Queue("email-queue", defaultQueueOptions);

// 2. Fila Webhooks de Pagamento (Abacate Pay Webhooks Seguros)
export const webhookQueue = new Queue("webhook-queue", defaultQueueOptions);
