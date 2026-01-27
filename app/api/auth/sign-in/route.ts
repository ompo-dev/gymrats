import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { signInSchema } from "@/lib/api/schemas";
import { db } from "@/lib/db";
import { type SignInInput, signInUseCase } from "@/lib/use-cases/auth";
import { createSession } from "@/lib/utils/session";

export async function POST(request: NextRequest) {
	try {
		// Validar body com Zod
		const validation = await validateBody(request, signInSchema);
		if (!validation.success) {
			return validation.response;
		}

		const result = await signInUseCase(
			{
				findUserByEmail: (email) =>
					db.user.findUnique({
						where: { email },
						include: {
							student: { select: { id: true } },
							gyms: { select: { id: true } },
						},
					}),
				comparePassword: (plain, hashed) => bcrypt.compare(plain, hashed),
				createSession,
			},
			validation.data as SignInInput,
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
		console.error("Erro ao fazer login:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Erro ao fazer login";
		const details =
			error instanceof Error && process.env.NODE_ENV === "development"
				? error.stack
				: undefined;

		return NextResponse.json(
			{
				error: errorMessage,
				details,
			},
			{ status: 500 },
		);
	}
}
