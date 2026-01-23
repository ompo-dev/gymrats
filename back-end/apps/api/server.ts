import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { corsPlugin } from "@back-end/src/server/plugins/cors";
import { dbPlugin } from "@back-end/src/server/plugins/db";
import { betterAuthPlugin } from "@back-end/src/server/plugins/auth";
import { authMacro } from "@back-end/src/server/plugins/auth-macro";
import { authRolesMacro } from "@back-end/src/server/plugins/auth-roles";
import { authRoutes } from "@modules/auth";
import { usersRoutes } from "@modules/users";
import { academiesRoutes } from "@modules/academies";
import { workoutsRoutes } from "@modules/workouts";
import { nutritionRoutes } from "@modules/ai";
import { billingRoutes, membershipsRoutes, paymentMethodsRoutes } from "@modules/billing";
import { foodsRoutes } from "@modules/ai";
import { applyPlugins } from "@plugins/index";
import { eventBus } from "@packages/events";
import "@plugins/community/challenges";
import "@plugins/community/ranking";
import "@plugins/community/badges";

export function createApiApp() {
  let app = new Elysia()
    .use(corsPlugin)
    .use(dbPlugin)
    .use(betterAuthPlugin)
    .use(authMacro)
    .use(authRolesMacro)
    .use(
      swagger({
        documentation: {
          info: {
            title: "GymRats API (Elysia)",
            version: "1.0.0",
          },
        },
      })
    )
    .group("/api", (group) =>
      group
        .group("/auth", (api) => api.use(authRoutes))
        .group("/users", (api) => api.use(usersRoutes))
        .group("/students", (api) => api.use(academiesRoutes.students))
        .group("/gyms", (api) => api.use(academiesRoutes.gyms))
        .group("/workouts", (api) => api.use(workoutsRoutes))
        .group("/nutrition", (api) => api.use(nutritionRoutes))
        .group("/foods", (api) => api.use(foodsRoutes))
        .group("/subscriptions", (api) => api.use(billingRoutes.subscriptions))
        .group("/gym-subscriptions", (api) =>
          api.use(billingRoutes.gymSubscriptions)
        )
        .group("/payments", (api) => api.use(billingRoutes.payments))
        .group("/payment-methods", (api) =>
          api.use(paymentMethodsRoutes)
        )
        .group("/memberships", (api) => api.use(membershipsRoutes))
    )
    .get("/health", () => ({ status: "ok" }));

  app = applyPlugins(app, eventBus);

  return app;
}

export const apiApp = createApiApp();

export function startServer(port = Number(process.env.PORT || 3001)) {
  apiApp.listen(port);
  console.log(
    `🦊 Elysia is running at ${apiApp.server?.hostname}:${apiApp.server?.port}`
  );
  return apiApp;
}
