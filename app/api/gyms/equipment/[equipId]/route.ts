import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { cookies } from "next/headers";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ equipId: string }> },
) {
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
		const { equipId } = await params;
		const body = await request.json();
		const { name, status, brand, model, serialNumber, nextMaintenance } = body;

		const validStatuses = ["available", "in-use", "maintenance", "broken"];
		if (status && !validStatuses.includes(status)) {
			return NextResponse.json({ error: "Status inválido" }, { status: 400 });
		}

		// Verificar se o equipamento pertence à academia ativa
		const existingEquipment = await db.equipment.findUnique({
			where: { id: equipId },
		});

		if (!existingEquipment || existingEquipment.gymId !== gymId) {
			return NextResponse.json(
				{ error: "Equipamento não encontrado" },
				{ status: 404 },
			);
		}

		const updatedEquipment = await db.equipment.update({
			where: { id: equipId },
			data: {
				...(name ? { name } : {}),
				...(status ? { status } : {}),
				...(brand !== undefined ? { brand } : {}),
				...(model !== undefined ? { model } : {}),
				...(serialNumber !== undefined ? { serialNumber } : {}),
				...(nextMaintenance
					? { nextMaintenance: new Date(nextMaintenance) }
					: {}),
			},
		});

		return NextResponse.json({ equipment: updatedEquipment });
	} catch (error) {
		console.error("[PATCH /api/gyms/equipment/[equipId]]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ equipId: string }> },
) {
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
		const { equipId } = await params;

		// Verificar se o equipamento pertence à academia ativa
		const existingEquipment = await db.equipment.findUnique({
			where: { id: equipId },
		});

		if (!existingEquipment || existingEquipment.gymId !== gymId) {
			return NextResponse.json(
				{ error: "Equipamento não encontrado" },
				{ status: 404 },
			);
		}

		await db.equipment.delete({
			where: { id: equipId },
		});

		// Atualizar contagem de equipamentos
		await db.gymProfile.update({
			where: { gymId },
			data: { equipmentCount: { decrement: 1 } },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[DELETE /api/gyms/equipment/[equipId]]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}
