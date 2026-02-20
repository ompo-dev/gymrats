import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";

async function getGymSession(sessionToken: string) {
	const session = await getSession(sessionToken);
	if (!session || session.user.role !== "GYM") return null;
	const user = await db.user.findUnique({
		where: { id: session.user.id },
		select: { activeGymId: true },
	});
	return user?.activeGymId ? { session, gymId: user.activeGymId } : null;
}

// GET — listar planos da academia
export async function GET(request: NextRequest) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;
		if (!sessionToken)
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

		const ctx = await getGymSession(sessionToken);
		if (!ctx)
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

		const { searchParams } = new URL(request.url);
		const includeInactive = searchParams.get("includeInactive") === "true";

		const plans = await db.membershipPlan.findMany({
			where: {
				gymId: ctx.gymId,
				...(includeInactive ? {} : { isActive: true }),
			},
			orderBy: { price: "asc" },
		});

		return NextResponse.json({
			plans: plans.map((p) => ({
				...p,
				benefits: p.benefits
					? (() => {
							try {
								return JSON.parse(p.benefits!);
							} catch {
								return [];
							}
						})()
					: [],
			})),
		});
	} catch (error) {
		console.error("[GET /api/gyms/plans]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}

// POST — criar novo plano
export async function POST(request: NextRequest) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;
		if (!sessionToken)
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

		const ctx = await getGymSession(sessionToken);
		if (!ctx)
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

		const body = await request.json();
		const { name, type, price, duration, benefits } = body;

		if (!name || !type || !price || !duration) {
			return NextResponse.json(
				{ error: "Campos obrigatórios: name, type, price, duration" },
				{ status: 400 },
			);
		}

		const validTypes = ["monthly", "quarterly", "semi-annual", "annual", "trial"];
		if (!validTypes.includes(type)) {
			return NextResponse.json({ error: "Tipo de plano inválido" }, { status: 400 });
		}

		const plan = await db.membershipPlan.create({
			data: {
				gymId: ctx.gymId,
				name,
				type,
				price: Number(price),
				duration: Number(duration),
				benefits: benefits ? JSON.stringify(benefits) : null,
			},
		});

		return NextResponse.json({ plan }, { status: 201 });
	} catch (error) {
		console.error("[POST /api/gyms/plans]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}
