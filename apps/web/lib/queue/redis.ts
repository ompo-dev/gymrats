import Redis from "ioredis";

// Conexão Redis instanciada usando a URL encriptada nas variáveis de ambiente
// Para o GymRats, esta URL (REDIS_URL ou UPSTASH_REDIS_URL) apontará para o Upstash ou local
const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || "redis://localhost:6379";

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Necessário pelo BullMQ (evita travar requisições de worker repetitivamente)
});

// Tratamento de falhas de conexão
redisConnection.on("error", (error) => {
  console.error("[Redis Connection] Failed:", error);
});
