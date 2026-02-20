import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";

async function getGymContext(sessionToken: string) {
	const session = await getSession(sessionToken);
	if (!session || session.user.role !== "GYM") return null;
	const user = await db.user.findUnique({
		where: { id: session.user.id },
		select: { activeGymId: true },
	});
	return user?.activeGymId ? { gymId: user.activeGymId } : null;
}

// GET — listar pagamentos
export async function GET(request: NextRequest) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;
		if (!sessionToken)
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

		const ctx = await getGymContext(sessionToken);
		if (!ctx)
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status");
		const studentId = searchParams.get("studentId");
		const startDate = searchParams.get("startDate");
		const endDate = searchParams.get("endDate");
		const limit = searchParams.get("limit")
			? Number(searchParams.get("limit"))
			: undefined;

		const whereClause: any = {
			gymId: ctx.gymId,
		};

		if (status && status !== "all") {
			whereClause.status = status;
		}

		if (studentId) {
			whereClause.studentId = studentId;
		}

		if (startDate || endDate) {
			whereClause.date = {};
			if (startDate) whereClause.date.gte = new Date(startDate);
			if (endDate) whereClause.date.lte = new Date(endDate);
		}

		const payments = await db.payment.findMany({
			where: whereClause,
			orderBy: { date: "desc" },
			take: limit,
			include: {
				plan: { select: { name: true } },
			},
		});

		return NextResponse.json({ payments });
	} catch (error) {
		console.error("[GET /api/gyms/payments]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}

// POST — criar novo pagamento (avulso ou de mensalidade)
export async function POST(request: NextRequest) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;
		if (!sessionToken)
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

		const ctx = await getGymContext(sessionToken);
		if (!ctx)
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

		const body = await request.json();
		const {
			studentId,
			studentName,
			planId,
			amount,
			dueDate,
			paymentMethod,
			reference, // opcional
		} = body;

		if (!studentId || !amount || !dueDate) {
			return NextResponse.json(
				{ error: "Campos obrigatórios: studentId, amount, dueDate" },
				{ status: 400 },
			);
		}

		const plan = planId
			? await db.membershipPlan.findUnique({ where: { id: planId } })
			: null;

		const payment = await db.payment.create({
			data: {
				gymId: ctx.gymId,
				studentId,
				studentName: studentName ?? "Aluno",
				planId: planId ?? null,
				amount: Number(amount),
				date: new Date(), // Data de criação do registro
				dueDate: new Date(dueDate),
				status: "pending",
				paymentMethod: paymentMethod ?? "pix",
				reference: reference ?? null,
			},
		});

		return NextResponse.json({ payment }, { status: 201 });
	} catch (error) {
		console.error("[POST /api/gyms/payments]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}
