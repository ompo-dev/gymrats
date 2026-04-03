import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
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
  .get("/health", () => ({ status: "ok" }));

log.info("[api] route runtime loaded", {
  routeCount: getRouteModuleCount({ exclude: [...routeModuleOverrides] }),
});
