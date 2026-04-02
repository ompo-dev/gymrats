import Redis from "ioredis";
import { log } from "@gymrats/domain/log";

function requiresManagedRedis() {
  const runtimeRole = process.env.GYMRATS_RUNTIME_ROLE;

  return (
    runtimeRole === "api" ||
    runtimeRole === "worker" ||
    runtimeRole === "cron" ||
    Boolean(process.env.RAILWAY_ENVIRONMENT_NAME)
  );
}

function resolveRedisUrl() {
  const url =
    process.env.REDIS_URL ||
    process.env.UPSTASH_REDIS_URL ||
    process.env.UPSTASH_REDIS_REST_URL;

  if (url) {
    return url;
  }

  if (process.env.VERCEL) {
    return "redis://localhost:6379";
  }

  if (process.env.NODE_ENV === "production" && requiresManagedRedis()) {
    throw new Error(
      "REDIS_URL (ou UPSTASH_REDIS_URL) eh obrigatoria em producao.",
    );
  }

  return "redis://localhost:6379";
}

export const redisConnection = new Redis(resolveRedisUrl(), {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redisConnection.on("error", (error) => {
  log.error("Redis connection failed", { error });
});
