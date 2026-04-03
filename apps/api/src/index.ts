import { apiApp } from "./app";
import { validateEnvironment } from "./lib/bootstrap/env-validation";
import { log } from "./lib/observability";
import { ensureRedisConnection } from "@gymrats/cache";

process.env.GYMRATS_RUNTIME_ROLE ??= "api";
validateEnvironment();
ensureRedisConnection().catch((error) => {
  log.warn("[api] Redis warmup failed", {
    error: error instanceof Error ? error.message : String(error),
  });
});

const port = Number(process.env.PORT || 3000);

apiApp.listen(port);

log.info("[api] Elysia backend listening", {
  hostname: apiApp.server?.hostname,
  port: apiApp.server?.port,
});
