import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { getGymContext } from "@/lib/utils/gym-context";

export async function POST(request: NextRequest) {
	try {
const { ctx, errorResponse } = await getGymContext();
		if (errorResponse) return errorResponse;
		const { gymId } = ctx;

		const body = await request.json();
		const { checkInId } = body as { checkInId: string };
		if (!checkInId) {
			return NextResponse.json(
				{ error: "checkInId obrigatório" },
				{ status: 400 },
			);
		}

		const checkIn = await db.checkIn.findUnique({ where: { id: checkInId } });
		if (!checkIn || checkIn.gymId !== gymId) {
			return NextResponse.json(
				{ error: "Check-in não encontrado" },
				{ status: 404 },
			);
		}
		if (checkIn.checkOut) {
			return NextResponse.json(
				{ error: "Checkout já realizado" },
				{ status: 409 },
			);
		}

		const now = new Date();
		const duration = Math.round(
			(now.getTime() - checkIn.timestamp.getTime()) / (1000 * 60),
		); // minutos

		const updated = await db.checkIn.update({
			where: { id: checkInId },
			data: { checkOut: now, duration },
		});

		return NextResponse.json({ success: true, checkIn: updated });
	} catch (error) {
		console.error("[POST /api/gyms/checkout]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}
