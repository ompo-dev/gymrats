import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { getGymContext } from "@/lib/utils/gym-context";

export async function POST(request: NextRequest) {
	try {
const { ctx, errorResponse } = await getGymContext();
		if (errorResponse) return errorResponse;
		const { gymId, user } = ctx;

		const body = await request.json();
		const { studentId } = body as { studentId: string };
		if (!studentId) {
			return NextResponse.json(
				{ error: "studentId obrigatório" },
				{ status: 400 },
			);
		}

		// Verificar se aluno é membro ativo
		const membership = await db.gymMembership.findFirst({
			where: { gymId, studentId, status: "active" },
		});
		if (!membership) {
			return NextResponse.json(
				{ error: "Aluno não é membro ativo desta academia" },
				{ status: 403 },
			);
		}

		// Verificar se já tem check-in aberto hoje
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const existingOpen = await db.checkIn.findFirst({
			where: {
				gymId,
				studentId,
				timestamp: { gte: today },
				checkOut: null,
			},
		});
		if (existingOpen) {
			return NextResponse.json(
				{
					error: "Aluno já tem check-in aberto hoje",
					checkInId: existingOpen.id,
				},
				{ status: 409 },
			);
		}

		// Buscar nome do aluno
		const studentUser = await db.user.findFirst({
			where: { student: { id: studentId } },
			select: { name: true },
		});

		const checkIn = await db.checkIn.create({
			data: {
				gymId,
				studentId,
				studentName: studentUser?.name ?? "Aluno",
			},
		});

		// Adicionar XP ao GymProfile (+5 XP por check-in)
		await db.gymProfile.updateMany({
			where: { gymId },
			data: { xp: { increment: 5 } },
		});

		return NextResponse.json({ success: true, checkIn }, { status: 201 });
	} catch (error) {
		console.error("[POST /api/gyms/checkin]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}
