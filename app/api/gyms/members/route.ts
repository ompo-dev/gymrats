import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { getGymContext } from "@/lib/utils/gym-context";

async function getActiveGymId(sessionUserId: string) {
	const user = await db.user.findUnique({
		where: { id: sessionUserId },
		select: { activeGymId: true },
	});
	return user?.activeGymId ?? null;
}

// GET — listar membros da academia (com suporte a ?status= e ?search=)
export async function GET(request: NextRequest) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;
		if (!sessionToken)
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

		const session = await getSession(sessionToken);
		if (!session)
			return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

		const gymId = await getActiveGymId(session.user.id);
		if (!gymId) return NextResponse.json({ members: [] });

		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status"); // active | suspended | canceled | all
		const search = searchParams.get("search"); // busca por nome

		const memberships = await db.gymMembership.findMany({
			where: {
				gymId,
				...(status && status !== "all" ? { status } : {}),
				...(search
					? {
							student: {
								user: { name: { contains: search, mode: "insensitive" } },
							},
						}
					: {}),
			},
			include: {
				student: {
					include: { user: true, profile: true, progress: true },
				},
				plan: true,
			},
			orderBy: { createdAt: "desc" },
			...(search ? { take: 10 } : {}),
		});

		return NextResponse.json({ members: memberships });
	} catch (error) {
		console.error("[GET /api/gyms/members]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}

// POST — matricular aluno
export async function POST(request: NextRequest) {
	try {
	const { ctx, errorResponse } = await getGymContext();
		if (errorResponse) return errorResponse;
		const { gymId } = ctx;

		const body = await request.json();
		const { studentId, planId, amount, autoRenew = true } = body;

		if (!studentId || !amount || amount <= 0) {
			return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
		}

		// Verificar se aluno existe
		const student = await db.student.findUnique({ where: { id: studentId } });
		if (!student) {
			return NextResponse.json(
				{ error: "Aluno não encontrado" },
				{ status: 404 },
			);
		}

		// Verificar se já tem matrícula ativa ou pendente
		const existing = await db.gymMembership.findFirst({
			where: {
				gymId,
				studentId,
				status: { in: ["active", "pending"] },
			},
		});
		if (existing) {
			return NextResponse.json(
				{ error: "Aluno já está matriculado" },
				{ status: 409 },
			);
		}

		// Calcular nextBillingDate com base no plano
		let nextBillingDate: Date | null = null;
		if (planId) {
			const plan = await db.membershipPlan.findUnique({
				where: { id: planId },
			});
			if (plan) {
				nextBillingDate = new Date();
				nextBillingDate.setDate(nextBillingDate.getDate() + plan.duration);
			}
		}

		const membership = await db.gymMembership.create({
			data: {
				gymId,
				studentId,
				planId: planId || null,
				amount,
				status: "active",
				autoRenew,
				nextBillingDate,
			},
			include: { student: { include: { user: true } }, plan: true },
		});

		// Atualizar contadores do GymProfile
		await db.gymProfile.updateMany({
			where: { gymId },
			data: {
				totalStudents: { increment: 1 },
				activeStudents: { increment: 1 },
			},
		});

		return NextResponse.json({ success: true, membership }, { status: 201 });
	} catch (error) {
		console.error("[POST /api/gyms/members]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}
