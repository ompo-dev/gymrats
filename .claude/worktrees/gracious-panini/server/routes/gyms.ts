import { Elysia } from "elysia";
import {
	createGymHandler,
	getGymLocationsHandler,
	getGymProfileHandler,
	listGymsHandler,
	setActiveGymHandler,
} from "../handlers/gyms";
import { authMacro } from "../plugins/auth-macro";

export const gymsRoutes = new Elysia()
	.use(authMacro)
	.get("/list", ({ set, userId }) => listGymsHandler({ set, userId }), {
		auth: true,
		detail: {
			summary: "Listar academias",
			description: "Academias do usuário GYM.",
		},
	})
	.post(
		"/create",
		({ set, body, userId }) => createGymHandler({ set, body, userId }),
		{
			auth: true,
			detail: {
				summary: "Criar academia",
				description: "Cadastra nova academia.",
			},
		},
	)
	.get("/profile", ({ set, userId }) => getGymProfileHandler({ set, userId }), {
		auth: true,
		detail: {
			summary: "Perfil da academia",
			description: "Dados do perfil da academia ativa.",
		},
	})
	.post(
		"/set-active",
		({ set, body, userId }) => setActiveGymHandler({ set, body, userId }),
		{
			auth: true,
			detail: {
				summary: "Definir academia ativa",
				description: "Alterna entre academias.",
			},
		},
	)
	.get(
		"/locations",
		({ set, query }) => getGymLocationsHandler({ set, query }),
		{
			detail: {
				summary: "Localizações",
				description:
					"Academias parceiras com preços. Use ?lat=&lng= para ordenar por distância.",
			},
		},
	);
