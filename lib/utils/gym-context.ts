import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";

export type GymContext = {
	gymId: string;
	session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
	user: NonNullable<Awaited<ReturnType<typeof getSession>>>["user"];
};

type GymContextResult =
	| { ctx: GymContext; errorResponse?: undefined }
	| { ctx?: undefined; errorResponse: NextResponse };

export async function getGymContext(): Promise<GymContextResult> {
	const cookieStore = await cookies();
	const sessionToken = cookieStore.get("auth_token")?.value;

	if (!sessionToken) {
		return {
			errorResponse: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
		};
	}

	const session = await getSession(sessionToken);
	if (!session) {
		return {
			errorResponse: NextResponse.json({ error: "Sessão inválida" }, { status: 401 }),
		};
	}

	if (session.user.role !== "GYM" && session.user.role !== "ADMIN") {
		return {
			errorResponse: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
		};
	}

	// Tenta obter activeGymId da sessão ou busca no banco se não estiver disponível
	let gymId = session.user.activeGymId;

	if (!gymId) {
		const user = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});
		gymId = user?.activeGymId ?? null;
	}

	if (!gymId) {
		return {
			errorResponse: NextResponse.json(
				{ error: "Nenhuma academia ativa configurada" },
				{ status: 400 },
			),
		};
	}

	return {
		ctx: {
			gymId,
			session,
			user: session.user,
		},
	};
}
