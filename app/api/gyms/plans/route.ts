import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { getGymContext } from "@/lib/utils/gym-context";



// GET — listar planos da academia
export async function GET(request: NextRequest) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;
		if (!sessionToken)
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });


		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse) return errorResponse;

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


		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse) return errorResponse;

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

		return NextResponse.json(
			{
				plan: {
					...plan,
					benefits: benefits ? benefits : [], // benefits já era o array original do body
				},
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("[POST /api/gyms/plans]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}
