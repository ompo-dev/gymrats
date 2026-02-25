import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";

export type GymContext = {
	gymId: string;
	session: any;
	user: any;
};

type GymContextResult =
	| { ctx: GymContext; errorResponse?: undefined }
	| { ctx?: undefined; errorResponse: NextResponse };

export async function getGymContext(): Promise<GymContextResult> {
	try {
		const headerList = await headers();

		// 1. Tentar Better Auth Primeiro
		try {
			const { auth } = await import("@/lib/auth-config");
			const betterAuthSession = await auth.api.getSession({
				headers: headerList,
			});

			if (betterAuthSession?.user) {
				const user = await db.user.findUnique({
					where: { id: betterAuthSession.user.id },
					include: { gyms: { select: { id: true } } },
				});

				if (user) {
					const isAdmin = user.role === "ADMIN";
					let gymId = user.activeGymId || user.gyms?.[0]?.id;

					if (isAdmin && !gymId) {
						const existingGym = await db.gym.findFirst({ where: { userId: user.id } });
						if (existingGym) {
							gymId = existingGym.id;
						} else {
							const newGym = await db.gym.create({
								data: {
									userId: user.id,
									name: user.name || "Admin Gym",
									address: "",
									phone: "",
									email: user.email,
									isActive: true,
								},
							});
							gymId = newGym.id;
						}
						
						// Atualizar activeGymId para o admin
						await db.user.update({
							where: { id: user.id },
							data: { activeGymId: gymId }
						});
					}

					if (gymId) {
						return {
							ctx: {
								gymId,
								session: betterAuthSession.session,
								user,
							},
						};
					}
				}
			}
		} catch (error) {
			console.error("[getGymContext] Erro Better Auth:", error);
		}

		// 2. Fallback Token manual
		const cookieStore = await cookies();
		let sessionToken =
			cookieStore.get("auth_token")?.value ||
			cookieStore.get("better-auth.session_token")?.value;

		if (!sessionToken) {
			const authHeader = headerList.get("authorization");
			if (authHeader) {
				sessionToken = authHeader.replace(/^Bearer\s+/i, "").trim() || undefined;
			}
		}

		if (!sessionToken) {
			return {
				errorResponse: NextResponse.json(
					{ error: "Não autenticado" },
					{ status: 401 },
				),
			};
		}

		const session = await getSession(sessionToken);
		if (!session) {
			return {
				errorResponse: NextResponse.json(
					{ error: "Sessão inválida" },
					{ status: 401 },
				),
			};
		}

		const gymId = session.user.activeGymId || session.user.gyms?.[0]?.id;
		if (!gymId) {
			return {
				errorResponse: NextResponse.json(
					{ error: "Academia não encontrada" },
					{ status: 403 },
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
	} catch (error) {
		console.error("[getGymContext] Erro:", error);
		return {
			errorResponse: NextResponse.json(
				{ error: "Erro ao processar autenticação" },
				{ status: 500 },
			),
		};
	}
}
