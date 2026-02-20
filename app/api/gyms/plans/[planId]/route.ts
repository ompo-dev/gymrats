import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";

async function getGymContext(sessionToken: string) {
	const session = await getSession(sessionToken);
	if (!session || (session.user.role !== "GYM" && session.user.role !== "ADMIN")) return null;
	const user = await db.user.findUnique({
		where: { id: session.user.id },
		select: { activeGymId: true },
	});
	return user?.activeGymId ? { gymId: user.activeGymId } : null;
}

// PATCH — atualizar plano (nome, preço, benefícios, ativar/desativar)
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ planId: string }> },
) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;
		if (!sessionToken)
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

		const ctx = await getGymContext(sessionToken);
		if (!ctx)
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

		const { planId } = await params;
		const body = await request.json();
		const { name, type, price, duration, benefits, isActive } = body;

		const plan = await db.membershipPlan.findFirst({
			where: { id: planId, gymId: ctx.gymId },
		});
		if (!plan)
			return NextResponse.json(
				{ error: "Plano não encontrado" },
				{ status: 404 },
			);

		const updated = await db.membershipPlan.update({
			where: { id: planId },
			data: {
				...(name !== undefined ? { name } : {}),
				...(type !== undefined ? { type } : {}),
				...(price !== undefined ? { price: Number(price) } : {}),
				...(duration !== undefined ? { duration: Number(duration) } : {}),
				...(benefits !== undefined
					? { benefits: JSON.stringify(benefits) }
					: {}),
				...(isActive !== undefined ? { isActive } : {}),
			},
		});

		return NextResponse.json({ plan: updated });
	} catch (error) {
		console.error("[PATCH /api/gyms/plans/[planId]]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}

// DELETE — desativar plano (soft delete)
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ planId: string }> },
) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;
		if (!sessionToken)
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

		const ctx = await getGymContext(sessionToken);
		if (!ctx)
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

		const { planId } = await params;

		const plan = await db.membershipPlan.findFirst({
			where: { id: planId, gymId: ctx.gymId },
		});
		if (!plan)
			return NextResponse.json(
				{ error: "Plano não encontrado" },
				{ status: 404 },
			);

		await db.membershipPlan.update({
			where: { id: planId },
			data: { isActive: false },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[DELETE /api/gyms/plans/[planId]]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}
