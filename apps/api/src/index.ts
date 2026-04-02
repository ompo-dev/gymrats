import { apiApp } from "./app";
import { validateEnvironment } from "./lib/bootstrap/env-validation";
import { log } from "./lib/observability";

process.env.GYMRATS_RUNTIME_ROLE ??= "api";
validateEnvironment();

const port = Number(process.env.PORT || 3000);

apiApp.listen(port);

log.info("[api] Elysia backend listening", {
  hostname: apiApp.server?.hostname,
  port: apiApp.server?.port,
});
