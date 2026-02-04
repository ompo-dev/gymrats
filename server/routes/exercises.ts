import { Elysia } from "elysia";
import { searchExercisesHandler } from "../handlers/exercises";

export const exercisesRoutes = new Elysia().get(
	"/search",
	({ set, query }) => searchExercisesHandler({ set, query }),
	{
		detail: {
			summary: "Buscar exercícios",
			description:
				"Busca no banco educacional. ?q=termo&muscle=peito&limit=20&offset=0",
		},
	},
);
