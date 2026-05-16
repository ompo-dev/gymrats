import type { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { signUpSchema } from "@/lib/api/schemas";
import { db } from "@/lib/db";
import { type SignUpInput, signUpUseCase } from "@/lib/use-cases/auth";
import { createSession } from "@/lib/utils/session";

export async function POST(request: NextRequest) {
	try {
		// Validar body com Zod
		const validation = await validateBody(request, signUpSchema);
		if (!validation.success) {
			return validation.response;
		}

		const result = await signUpUseCase(
			{
				findUserByEmail: (email) => db.user.findUnique({ where: { email } }),
				hashPassword: (plain) => bcrypt.hash(plain, 10),
				createUser: (data) =>
					db.user.create({
						data: {
							...data,
							role: data.role as UserRole,
						},
					}),
				createStudent: (userId) =>
					db.student.create({ data: { userId } }).then(() => undefined),
				createSession,
			},
			validation.data as SignUpInput,
		);

		if (!result.ok) {
			return NextResponse.json(
				{ error: result.error.message },
				{ status: result.error.status },
			);
		}

		const response = NextResponse.json({
			user: result.data.user,
			session: result.data.session,
		});

		response.cookies.set("auth_token", result.data.sessionToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30,
			path: "/",
		});

		return response;
	} catch (error: unknown) {
		console.error("Erro ao criar conta:", error);
		const message =
			error instanceof Error ? error.message : "Erro ao criar conta";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
