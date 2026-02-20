import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;

		if (!sessionToken) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
		}

		const session = await getSession(sessionToken);
		if (!session) {
			return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
		}

		if (session.user.role !== "GYM" && session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});

		if (!user?.activeGymId) {
			return NextResponse.json(
				{ error: "Nenhuma academia ativa" },
				{ status: 400 },
			);
		}

		const gymId = user.activeGymId;
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
