import type { Gym, Student } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { updateUserRoleSchema } from "@/lib/api/schemas";
import { db } from "@/lib/db";
import {
	initializeGymTrial,
	initializeStudentTrial,
} from "@/lib/utils/auto-trial";

export async function POST(request: NextRequest) {
	try {
		// Validar body com Zod
		const validation = await validateBody(request, updateUserRoleSchema);
		if (!validation.success) {
			return validation.response;
		}

		const { userId, role } = validation.data;

		const updatedUser = await db.user.update({
			where: { id: userId },
			data: { role: role as "STUDENT" | "GYM" },
		});

		// Criar Student ou Gym se necessário e inicializar trial
		if (role === "STUDENT") {
			const existingStudent = await db.student.findUnique({
				where: { userId },
			});

			let student: Student;
			if (!existingStudent) {
				student = await db.student.create({
					data: { userId },
				});
			} else {
				student = existingStudent;
			}

			// Inicializar trial automaticamente para o aluno
			if (student) {
				await initializeStudentTrial(student.id);
			}
		} else if (role === "GYM") {
			const existingGym = await db.gym.findUnique({
				where: { userId },
			});

			let gym: Gym;
			if (!existingGym) {
				gym = await db.gym.create({
					data: {
						userId,
						name: updatedUser.name,
						address: "",
						phone: "",
						email: updatedUser.email,
					},
				});
			} else {
				gym = existingGym;
			}

			// Inicializar trial automaticamente para a academia
			if (gym) {
				await initializeGymTrial(gym.id);
			}
		}

		return NextResponse.json({
			success: true,
			user: {
				id: updatedUser.id,
				role: updatedUser.role,
			},
		});
	} catch (error: unknown) {
		console.error("Erro ao atualizar role:", error);
		const err = error instanceof Error ? error : new Error(String(error));
		return NextResponse.json(
			{ error: err.message || "Erro ao atualizar tipo de usuário" },
			{ status: 500 },
		);
	}
}
