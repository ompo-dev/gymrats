import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { getGymContext } from "@/lib/utils/gym-context";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
	try {
	const { ctx, errorResponse } = await getGymContext();
		if (errorResponse) return errorResponse;
		const { gymId } = ctx;

		const body = await request.json();
		const { name, type, brand, model, serialNumber, purchaseDate } = body;

		if (!name || !type) {
			return NextResponse.json(
				{ error: "Nome e tipo são obrigatórios" },
				{ status: 400 },
			);
		}

		const equipment = await db.equipment.create({
			data: {
				gymId,
				name,
				type,
				brand: brand || null,
				model: model || null,
				serialNumber: serialNumber || null,
				purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
				status: "available",
			},
		});

		// Atualizar contagem de equipamentos no perfil da academia
		await db.gymProfile.update({
			where: { gymId },
			data: { equipmentCount: { increment: 1 } },
		});

		return NextResponse.json({ equipment }, { status: 201 });
	} catch (error) {
		console.error("[POST /api/gyms/equipment]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}
