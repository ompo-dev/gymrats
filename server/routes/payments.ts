import { Elysia } from "elysia";
import { getPaymentsHandler } from "../handlers/payments";
import { authRolesMacro } from "../plugins/auth-roles";

export const paymentsRoutes = new Elysia()
	.use(authRolesMacro)
	.get(
		"/",
		({ set, query, studentId }) =>
			getPaymentsHandler({ set, query, studentId }),
		{
			requireStudent: true,
			detail: {
				summary: "Pagamentos",
				description:
					"Histórico de pagamentos. Use ?limit=&offset= para paginação.",
			},
		},
	);
