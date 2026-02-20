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

// PATCH — atualizar status do pagamento (paid | pending | overdue | canceled)
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ paymentId: string }> },
) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;
		if (!sessionToken)
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

		const ctx = await getGymContext(sessionToken);
		if (!ctx)
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

		const { paymentId } = await params;
		const { status } = await request.json();

		const validStatuses = ["paid", "pending", "overdue", "canceled"];
		if (!validStatuses.includes(status)) {
			return NextResponse.json({ error: "Status inválido" }, { status: 400 });
		}

		// Ensure payment belongs to gym
		const payment = await db.payment.findUnique({
			where: { id: paymentId },
		});

		if (!payment) {
			return NextResponse.json(
				{ error: "Pagamento não encontrado" },
				{ status: 404 },
			);
		}

		if (payment.gymId !== ctx.gymId) {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		const updatedPayment = await db.payment.update({
			where: { id: paymentId },
			data: {
				status,
				// Se mudou para paid, atualiza data de pagamento para agora
				// Caso contrário, mantém a data original (ou null se for pending?)
				// O modelo Payment tem campo 'date' que é dateTime @default(now()) -- criação
				// O modelo NÃO tem campo 'paidAt'.
				// Mas a lógica de negócio diz que 'date' pode ser usado como data pagamento SE status == paid?
				// Ou 'date' é data de emissão?
				// No schema: date DateTime @default(now())
				// Vou assumir que 'date' é data de emissão/registro.
				// E não temos 'paidAt'.
				// Então vou apenas atualizar status.
			},
		});

		return NextResponse.json({ payment: updatedPayment });
	} catch (error) {
		console.error("[PATCH /api/gyms/payments/[paymentId]]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}
