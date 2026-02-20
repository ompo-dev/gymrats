import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { getGymContext } from "@/lib/utils/gym-context";



// PATCH — atualizar status da matrícula (ativo/suspenso/cancelado)
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ membershipId: string }> },
) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;
		if (!sessionToken)
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });


		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse) return errorResponse;

		const { membershipId } = await params;
		const body = await request.json();
		const { status, planId, amount } = body;

		const validStatuses = ["active", "suspended", "canceled"];
		if (status && !validStatuses.includes(status)) {
			return NextResponse.json({ error: "Status inválido" }, { status: 400 });
		}

		// Buscar estado anterior para ajustar contadores
		const current = await db.gymMembership.findFirst({
			where: { id: membershipId, gymId: ctx.gymId },
			select: { status: true },
		});
		if (!current) {
			return NextResponse.json(
				{ error: "Matrícula não encontrada" },
				{ status: 404 },
			);
		}

		const membership = await db.gymMembership.update({
			where: { id: membershipId, gymId: ctx.gymId },
			data: {
				...(status ? { status } : {}),
				...(planId ? { planId } : {}),
				...(amount ? { amount: Number(amount) } : {}),
			},
			include: { student: { include: { user: true } }, plan: true },
		});

		// Atualizar GymProfile.activeStudents ao mudar status
		if (status && status !== current.status) {
			const wasActive = current.status === "active";
			const isNowActive = status === "active";

			if (wasActive && !isNowActive) {
				await db.gymProfile.updateMany({
					where: { gymId: ctx.gymId },
					data: { activeStudents: { decrement: 1 } },
				});
			} else if (!wasActive && isNowActive) {
				await db.gymProfile.updateMany({
					where: { gymId: ctx.gymId },
					data: { activeStudents: { increment: 1 } },
				});
			}
		}

		return NextResponse.json({ success: true, membership });
	} catch (error) {
		console.error("[PATCH /api/gyms/members/[membershipId]]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}

// DELETE — cancelar matrícula de vez
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ membershipId: string }> },
) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;
		if (!sessionToken)
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });


		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse) return errorResponse;

		const { membershipId } = await params;

		const current = await db.gymMembership.findFirst({
			where: { id: membershipId, gymId: ctx.gymId },
			select: { status: true },
		});
		if (!current)
			return NextResponse.json(
				{ error: "Matrícula não encontrada" },
				{ status: 404 },
			);

		await db.gymMembership.update({
			where: { id: membershipId },
			data: { status: "canceled" },
		});

		if (current.status === "active") {
			await db.gymProfile.updateMany({
				where: { gymId: ctx.gymId },
				data: {
					activeStudents: { decrement: 1 },
					totalStudents: { decrement: 1 },
				},
			});
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[DELETE /api/gyms/members/[membershipId]]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}
