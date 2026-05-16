import { Elysia } from "elysia";
import { getMembershipsHandler } from "../handlers/payments";
import { authRolesMacro } from "../plugins/auth-roles";

export const membershipsRoutes = new Elysia()
	.use(authRolesMacro)
	.get("/", ({ set, studentId }) => getMembershipsHandler({ set, studentId }), {
		requireStudent: true,
		detail: {
			summary: "Memberships",
			description: "Planos de academia do aluno.",
		},
	});
