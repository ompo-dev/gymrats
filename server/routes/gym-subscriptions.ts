import { Elysia } from "elysia";
import {
	cancelGymSubscriptionHandler,
	createGymSubscriptionHandler,
	getCurrentGymSubscriptionHandler,
	startGymTrialHandler,
} from "../handlers/gym-subscriptions";
import { authRolesMacro } from "../plugins/auth-roles";

export const gymSubscriptionsRoutes = new Elysia()
	.use(authRolesMacro)
	.get(
		"/current",
		({ set, userId }) => getCurrentGymSubscriptionHandler({ set, userId }),
		{
			requireGym: true,
			detail: {
				summary: "Assinatura atual",
				description: "Assinatura da academia ativa.",
			},
		},
	)
	.post(
		"/create",
		({ set, body, userId }) =>
			createGymSubscriptionHandler({ set, body, userId }),
		{
			requireGym: true,
			detail: {
				summary: "Criar assinatura",
				description: "Plano e período de cobrança.",
			},
		},
	)
	.post(
		"/start-trial",
		({ set, userId }) => startGymTrialHandler({ set, userId }),
		{
			requireGym: true,
			detail: { summary: "Iniciar trial", description: "14 dias grátis." },
		},
	)
	.post(
		"/cancel",
		({ set, userId }) => cancelGymSubscriptionHandler({ set, userId }),
		{
			requireGym: true,
			detail: {
				summary: "Cancelar assinatura",
				description: "Cancela assinatura da academia.",
			},
		},
	);
