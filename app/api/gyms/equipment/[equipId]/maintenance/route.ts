import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { getGymContext } from "@/lib/utils/gym-context";
import { cookies } from "next/headers";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ equipId: string }> },
) {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse) return errorResponse;
		const { gymId } = ctx;

		const { equipId } = await params;
		const body = await request.json();
		// cost pode vir como string ou number
		const { type, description, performedBy, cost, nextScheduled } = body;

		if (!type || !description || !performedBy) {
			return NextResponse.json(
				{ error: "Tipo, descrição e responsável são obrigatórios" },
				{ status: 400 },
			);
		}

		// Verificar se o equipamento existe e pertence à academia
		const equipment = await db.equipment.findFirst({
			where: { id: equipId, gymId },
		});

		if (!equipment) {
			return NextResponse.json(
				{ error: "Equipamento não encontrado" },
				{ status: 404 },
			);
		}

		const record = await db.maintenanceRecord.create({
			data: {
				equipmentId: equipId,
				date: new Date(),
				type,
				description,
				performedBy,
				cost: cost ? Number(cost) : null,
				nextScheduled: nextScheduled ? new Date(nextScheduled) : null,
			},
		});

		// Atualizar o equipamento: última manutenção, próxima manutenção e status
		await db.equipment.update({
			where: { id: equipId },
			data: {
				lastMaintenance: new Date(),
				...(nextScheduled
					? { nextMaintenance: new Date(nextScheduled) }
					: {}),
				status: "available", // Assume que após registrar manutenção (corretiva/preventiva), volta a estar disponível, ou o usuário muda status manualmente depois?
				// O plano diz: "se estava em manutenção, voltar para disponível". Vamos manter essa lógica por enquanto.
			},
		});

		return NextResponse.json({ record }, { status: 201 });
	} catch (error) {
		console.error("[POST /api/gyms/equipment/[equipId]/maintenance]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}
