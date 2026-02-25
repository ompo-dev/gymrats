import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";

export type StudentContext = {
	studentId: string;
	session: any;
	user: any;
	student: any;
};

type StudentContextResult =
	| { ctx: StudentContext; error?: undefined }
	| { ctx?: undefined; error: string };

export async function getStudentContext(): Promise<StudentContextResult> {
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
					include: { student: true },
				});

				if (user) {
					const isAdmin = user.role === "ADMIN";
					let student = user.student;

					if (isAdmin && !student) {
						student = await db.student.findUnique({ where: { userId: user.id } });
						if (!student) {
							student = await db.student.create({ data: { userId: user.id } });
						}
					}

					if (student) {
						return {
							ctx: {
								studentId: student.id,
								session: betterAuthSession.session,
								user: user,
								student: student,
							},
						};
					}
				}
			}
		} catch (error) {
			console.error("[getStudentContext] Erro Better Auth:", error);
		}

		// 2. Fallback para Manual Token
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
			return { error: "Não autenticado." };
		}

		const session = await getSession(sessionToken);
		if (!session || !session.user) {
			return { error: "Sessão inválida." };
		}

		const isAdmin = session.user.role === "ADMIN";
		let student = session.user.student;

		if (isAdmin && !student) {
			const existingStudent = await db.student.findUnique({ where: { userId: session.user.id } });
			if (!existingStudent) {
				student = await db.student.create({ data: { userId: session.user.id } });
			} else {
				student = existingStudent;
			}
		}

		if (!student) {
			return { error: "Perfil de aluno não encontrado." };
		}

		return {
			ctx: {
				studentId: student.id,
				session: session,
				user: session.user,
				student: student,
			},
		};
	} catch (error) {
		console.error("[getStudentContext] Erro:", error);
		return { error: "Erro ao processar autenticação." };
	}
}
