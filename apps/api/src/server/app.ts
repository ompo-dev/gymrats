import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import {
  createRouteModulesPlugin,
  getRouteModuleCount,
} from "./route-modules";
import { corsPlugin } from "./plugins/cors";
import { dbPlugin } from "./plugins/db";
import { rateLimitPlugin } from "./plugins/rate-limit";
import { requestLoggerPlugin } from "./plugins/request-logger";

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

console.log(
  `[api] route runtime loaded with ${getRouteModuleCount({ exclude: [...routeModuleOverrides] })} route files`,
);
