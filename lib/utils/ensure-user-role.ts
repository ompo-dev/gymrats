/**
 * Garante que o usuário tenha role STUDENT ou GYM e o registro correspondente.
 * Usado no onboarding quando o usuário é PENDING - cadastra apenas ao concluir.
 */

import { db } from "@/lib/db";
import {
	initializeGymTrial,
	initializeStudentTrial,
} from "@/lib/utils/auto-trial";

export type EnsureRoleResult =
	| { ok: true; studentId?: string; gymId?: string }
	| { ok: false; error: string };

export async function ensureStudentRole(
	userId: string,
): Promise<EnsureRoleResult> {
	try {
		await db.user.update({
			where: { id: userId },
			data: { role: "STUDENT" },
		});

		let student = await db.student.findUnique({
			where: { userId },
		});

		if (!student) {
			student = await db.student.create({
				data: { userId },
			});
		}

		await initializeStudentTrial(student.id);

		return { ok: true, studentId: student.id };
	} catch (error) {
		console.error("[ensureStudentRole] Erro:", error);
		return {
			ok: false,
			error: error instanceof Error ? error.message : "Erro ao criar perfil",
		};
	}
}

export async function ensureGymRole(
	userId: string,
	userName: string,
	userEmail: string,
): Promise<EnsureRoleResult> {
	try {
		const updatedUser = await db.user.update({
			where: { id: userId },
			data: { role: "GYM" },
		});

		let gym = await db.gym.findUnique({
			where: { userId },
		});

		if (!gym) {
			gym = await db.gym.create({
				data: {
					userId,
					name: updatedUser.name || userName,
					address: "",
					phone: "",
					email: updatedUser.email || userEmail,
				},
			});
		}

		await initializeGymTrial(gym.id);

		return { ok: true, gymId: gym.id };
	} catch (error) {
		console.error("[ensureGymRole] Erro:", error);
		return {
			ok: false,
			error: error instanceof Error ? error.message : "Erro ao criar perfil",
		};
	}
}
