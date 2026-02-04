import { Elysia } from "elysia";
import { uploadFoodsHandler } from "../handlers/foods";
import { getFoodByIdHandler, searchFoodsHandler } from "../handlers/nutrition";
import { authRolesMacro } from "../plugins/auth-roles";

export const foodsRoutes = new Elysia()
	.use(authRolesMacro)
	.get("/search", ({ set, query }) => searchFoodsHandler({ set, query }), {
		detail: {
			summary: "Buscar alimentos",
			description: "Busca por nome. Use ?query=termo.",
		},
	})
	.get("/:id", ({ set, params }) => getFoodByIdHandler({ set, params }), {
		detail: {
			summary: "Alimento por ID",
			description: "Retorna detalhes de um alimento.",
		},
	})
	.post("/upload", ({ set, request }) => uploadFoodsHandler({ set, request }), {
		requireAdmin: true,
		detail: {
			summary: "Upload CSV",
			description: "Importa alimentos via CSV. Apenas ADMIN.",
		},
	});
