import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { betterAuthPlugin } from "./plugins/auth";
import { authMacro } from "./plugins/auth-macro";
import { authRolesMacro } from "./plugins/auth-roles";
import { corsPlugin } from "./plugins/cors";
import { dbPlugin } from "./plugins/db";
import { requestLoggerPlugin } from "./plugins/request-logger";
import { authRoutes } from "./routes/auth";
import { exercisesRoutes } from "./routes/exercises";
import { foodsRoutes } from "./routes/foods";
import { gymSubscriptionsRoutes } from "./routes/gym-subscriptions";
import { gymsRoutes } from "./routes/gyms";
import { membershipsRoutes } from "./routes/memberships";
import { nutritionRoutes } from "./routes/nutrition";
import { paymentMethodsRoutes } from "./routes/payment-methods";
import { paymentsRoutes } from "./routes/payments";
import { studentsRoutes } from "./routes/students";
import { subscriptionsRoutes } from "./routes/subscriptions";
import { usersRoutes } from "./routes/users";
import { workoutsRoutes } from "./routes/workouts";

export const apiApp = new Elysia()
	.use(corsPlugin)
	.use(dbPlugin)
	.use(betterAuthPlugin)
	.use(authMacro)
	.use(authRolesMacro)
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
	.group("/api", (app) =>
		app
			.group("/auth", (group) => group.use(authRoutes))
			.group("/users", (group) => group.use(usersRoutes))
			.group("/students", (group) => group.use(studentsRoutes))
			.group("/gyms", (group) => group.use(gymsRoutes))
			.group("/workouts", (group) => group.use(workoutsRoutes))
			.group("/nutrition", (group) => group.use(nutritionRoutes))
			.group("/foods", (group) => group.use(foodsRoutes))
			.group("/exercises", (group) => group.use(exercisesRoutes))
			.group("/subscriptions", (group) => group.use(subscriptionsRoutes))
			.group("/gym-subscriptions", (group) => group.use(gymSubscriptionsRoutes))
			.group("/payments", (group) => group.use(paymentsRoutes))
			.group("/payment-methods", (group) => group.use(paymentMethodsRoutes))
			.group("/memberships", (group) => group.use(membershipsRoutes)),
	)
	.get("/health", () => ({ status: "ok" }));
