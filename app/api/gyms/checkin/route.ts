import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";

export async function POST(request: NextRequest) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;
		if (!sessionToken) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
		}

		const session = await getSession(sessionToken);
		if (!session || (session.user.role !== "GYM" && session.user.role !== "ADMIN")) {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});
		if (!user?.activeGymId) {
			return NextResponse.json(
				{ error: "Academia não configurada" },
				{ status: 400 },
			);
		}

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
			where: { gymId: user.activeGymId, studentId, status: "active" },
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
				gymId: user.activeGymId,
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
				gymId: user.activeGymId,
				studentId,
				studentName: studentUser?.name ?? "Aluno",
			},
		});

		// Adicionar XP ao GymProfile (+5 XP por check-in)
		await db.gymProfile.updateMany({
			where: { gymId: user.activeGymId },
			data: { xp: { increment: 5 } },
		});

		return NextResponse.json({ success: true, checkIn }, { status: 201 });
	} catch (error) {
		console.error("[POST /api/gyms/checkin]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}
