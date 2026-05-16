import { Elysia } from "elysia";
import { updateUserRoleSchema } from "@/lib/api/schemas";
import { db } from "@/lib/db";
import {
	initializeGymTrial,
	initializeStudentTrial,
} from "@/lib/utils/auto-trial";
import { authMacro } from "../plugins/auth-macro";
import {
	badRequestResponse,
	forbiddenResponse,
	internalErrorResponse,
} from "../utils/response";
import { validateBody } from "../utils/validation";

export const usersRoutes = new Elysia().use(authMacro).post(
	"/update-role",
	async ({ body, set, userId: sessionUserId, user }) => {
		const validation = validateBody(body, updateUserRoleSchema);
		if (!validation.success) {
			return badRequestResponse(
				set,
				`Erros de validação: ${validation.errors.join("; ")}`,
				{ errors: validation.errors },
			);
		}

		const { userId, role } = validation.data;
		const isAdmin = user?.role === "ADMIN";
		const isSelfUpdate = userId === sessionUserId;
		if (!isAdmin && !isSelfUpdate) {
			return forbiddenResponse(
				set,
				"Só é possível alterar o próprio tipo ou ser ADMIN",
			);
		}

		try {
			const updatedUser = await db.user.update({
				where: { id: userId },
				data: { role: role as "STUDENT" | "GYM" },
			});

			if (role === "STUDENT") {
				const existingStudent = await db.student.findUnique({
					where: { userId },
				});

				const student =
					existingStudent ??
					(await db.student.create({
						data: { userId },
					}));

				await initializeStudentTrial(student.id);
			} else if (role === "GYM") {
				const existingGym = await db.gym.findFirst({
					where: { userId },
				});

				const gym =
					existingGym ??
					(await db.gym.create({
						data: {
							userId,
							name: updatedUser.name,
							address: "",
							phone: "",
							email: updatedUser.email,
						},
					}));

				await initializeGymTrial(gym.id);
			}

			return {
				success: true,
				user: {
					id: updatedUser.id,
					role: updatedUser.role,
				},
			};
		} catch (error) {
			console.error("Erro ao atualizar role:", error);
			return internalErrorResponse(
				set,
				"Erro ao atualizar tipo de usuário",
				error,
			);
		}
	},
	{
		auth: true,
		detail: {
			summary: "Atualizar role do usuário",
			description:
				"Altera o tipo (STUDENT/GYM). Permite self-update no onboarding ou ADMIN para qualquer usuário.",
		},
	},
);
