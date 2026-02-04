import { Elysia } from "elysia";
import {
	getDailyNutritionHandler,
	updateDailyNutritionHandler,
} from "../handlers/nutrition";
import { nutritionChatHandler } from "../handlers/nutrition-ai";
import { authRolesMacro } from "../plugins/auth-roles";

export const nutritionRoutes = new Elysia()
	.use(authRolesMacro)
	.get(
		"/daily",
		({ set, query, studentId }) =>
			getDailyNutritionHandler({ set, query, studentId }),
		{
			requireStudent: true,
			detail: {
				summary: "Nutrição diária",
				description: "Retorna refeições e macros do dia. Use ?date=YYYY-MM-DD.",
			},
		},
	)
	.post(
		"/daily",
		({ set, body, studentId }) =>
			updateDailyNutritionHandler({ set, body, studentId }),
		{
			requireStudent: true,
			detail: {
				summary: "Atualizar nutrição diária",
				description: "Salva refeições e água.",
			},
		},
	)
	.post(
		"/chat",
		({ set, body, studentId }) =>
			nutritionChatHandler({ set, body, studentId }),
		{
			requireStudent: true,
			detail: {
				summary: "Chat de nutrição",
				description: "Assistente IA para alimentação.",
			},
		},
	);
