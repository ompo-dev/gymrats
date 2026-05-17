import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { ensureRedisConnection, redisConnection } from "@gymrats/cache";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { corsPlugin } from "./plugins/cors";
import { dbPlugin } from "./plugins/db";
import { rateLimitPlugin } from "./plugins/rate-limit";
import { requestLoggerPlugin } from "./plugins/request-logger";
import { createRouteModulesPlugin, getRouteModuleCount } from "./route-modules";

const routeModuleOverrides = [
  "/api/cron/week-reset",
  "/api/webhooks/abacatepay",
] as const;

type DependencyReadiness = {
  status: "ready" | "not_ready";
  latencyMs: number;
  error?: string;
};

async function checkDatabaseReadiness(): Promise<DependencyReadiness> {
  const startedAt = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;

    return {
      status: "ready",
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      status: "not_ready",
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkRedisReadiness(): Promise<DependencyReadiness> {
  const startedAt = Date.now();

  try {
    await ensureRedisConnection();
    const response = await redisConnection.ping();
    if (response !== "PONG") {
      throw new Error(`Unexpected Redis ping response: ${response}`);
    }

    return {
      status: "ready",
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      status: "not_ready",
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const apiApp = new Elysia()
  .use(rateLimitPlugin)
  .use(corsPlugin)
  .use(dbPlugin)
  .use(requestLoggerPlugin)
  .use(
    swagger({
      documentation: {
        info: {
          title: "GymRats API (Elysia)",
          version: "1.0.0",
        },
      },
    }),
  )
  .use(createRouteModulesPlugin({ exclude: [...routeModuleOverrides] }))
  .get("/health", () => ({ status: "ok" }))
  .get("/healthz", () => ({ status: "ok" }))
  .get("/readyz", async ({ set }) => {
    const [database, redis] = await Promise.all([
      checkDatabaseReadiness(),
      checkRedisReadiness(),
    ]);

    const isReady =
      database.status === "ready" && redis.status === "ready";

    if (!isReady) {
      set.status = 503;
      log.warn("[api] readiness check failed", {
        database,
        redis,
      });
    }

    return {
      status: isReady ? "ready" : "not_ready",
      dependencies: {
        database,
        redis,
      },
    };
  });

log.info("[api] route runtime loaded", {
  routeCount: getRouteModuleCount({ exclude: [...routeModuleOverrides] }),
});
