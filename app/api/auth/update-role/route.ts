import { type NextRequest, NextResponse } from "next/server";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { updateRoleSchema } from "@/lib/api/schemas";
import { db } from "@/lib/db";
import { type UpdateRoleInput, updateRoleUseCase } from "@/lib/use-cases/auth";

export async function POST(request: NextRequest) {
	try {
		// Validar body com Zod
		const validation = await validateBody(request, updateRoleSchema);
		if (!validation.success) {
			return validation.response;
		}

		const result = await updateRoleUseCase(
			{
				findUserById: (id) =>
					db.user.findUnique({
						where: { id },
						include: { student: true, gyms: true },
					}),
				updateUserRole: (id, role) =>
					db.user.update({ where: { id }, data: { role } }),
				findStudentByUserId: (id) =>
					db.student.findUnique({ where: { userId: id } }),
				createStudent: (id) =>
					db.student.create({ data: { userId: id } }).then(() => undefined),
				findGymByUserId: (id) => db.gym.findFirst({ where: { userId: id } }),
				createGym: (data) => db.gym.create({ data }).then(() => undefined),
			},
			validation.data as UpdateRoleInput,
		);

		if (!result.ok) {
			return NextResponse.json(
				{ error: result.error.message },
				{ status: result.error.status },
			);
		}

		return NextResponse.json(result.data);
	} catch (error: unknown) {
		console.error("Erro ao atualizar role:", error);
		const message =
			error instanceof Error
				? error.message
				: "Erro ao atualizar tipo de usuário";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
