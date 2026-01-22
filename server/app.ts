import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { corsPlugin } from "./plugins/cors";
import { dbPlugin } from "./plugins/db";
import { betterAuthPlugin } from "./plugins/auth";
import { authMacro } from "./plugins/auth-macro";
import { authRolesMacro } from "./plugins/auth-roles";
import { authRoutes } from "./routes/auth";
import { usersRoutes } from "./routes/users";
import { studentsRoutes } from "./routes/students";
import { gymsRoutes } from "./routes/gyms";
import { workoutsRoutes } from "./routes/workouts";
import { nutritionRoutes } from "./routes/nutrition";
import { foodsRoutes } from "./routes/foods";
import { subscriptionsRoutes } from "./routes/subscriptions";
import { gymSubscriptionsRoutes } from "./routes/gym-subscriptions";
import { paymentsRoutes } from "./routes/payments";
import { paymentMethodsRoutes } from "./routes/payment-methods";
import { membershipsRoutes } from "./routes/memberships";

export const apiApp = new Elysia()
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
  .group("/api", (app) =>
    app
      .group("/auth", (group) => group.use(authRoutes))
      .group("/users", (group) => group.use(usersRoutes))
      .group("/students", (group) => group.use(studentsRoutes))
      .group("/gyms", (group) => group.use(gymsRoutes))
      .group("/workouts", (group) => group.use(workoutsRoutes))
      .group("/nutrition", (group) => group.use(nutritionRoutes))
      .group("/foods", (group) => group.use(foodsRoutes))
      .group("/subscriptions", (group) => group.use(subscriptionsRoutes))
      .group("/gym-subscriptions", (group) => group.use(gymSubscriptionsRoutes))
      .group("/payments", (group) => group.use(paymentsRoutes))
      .group("/payment-methods", (group) => group.use(paymentMethodsRoutes))
      .group("/memberships", (group) => group.use(membershipsRoutes))
  )
  .get("/health", () => ({ status: "ok" }));
