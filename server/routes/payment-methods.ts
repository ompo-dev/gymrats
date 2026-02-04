import { Elysia } from "elysia";
import {
	addPaymentMethodHandler,
	getPaymentMethodsHandler,
} from "../handlers/payments";
import { authMacro } from "../plugins/auth-macro";

export const paymentMethodsRoutes = new Elysia()
	.use(authMacro)
	.get("/", ({ set, userId }) => getPaymentMethodsHandler({ set, userId }), {
		auth: true,
		detail: {
			summary: "Métodos de pagamento",
			description: "Cartões e PIX salvos.",
		},
	})
	.post(
		"/",
		({ set, body, userId }) => addPaymentMethodHandler({ set, body, userId }),
		{
			auth: true,
			detail: {
				summary: "Adicionar método",
				description: "Cadastra cartão ou PIX.",
			},
		},
	);
