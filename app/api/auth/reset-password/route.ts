import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { resetPasswordSchema } from "@/lib/api/schemas";
import { db } from "@/lib/db";
import {
	type ResetPasswordInput,
	resetPasswordUseCase,
} from "@/lib/use-cases/auth";

/**
 * POST /api/auth/reset-password
 * Redefine a senha do usuário após verificar o código
 */
export async function POST(request: NextRequest) {
	try {
		const validation = await validateBody(request, resetPasswordSchema);
		if (!validation.success) {
			return validation.response;
		}

		const result = await resetPasswordUseCase(
			{
				findVerificationToken: (identifier, token) =>
					db.verificationToken.findUnique({
						where: { identifier_token: { identifier, token } },
						select: { expires: true },
					}),
				deleteVerificationToken: (identifier, token) =>
					db.verificationToken
						.delete({
							where: { identifier_token: { identifier, token } },
						})
						.then(() => undefined),
				findUserByEmail: (email) => db.user.findUnique({ where: { email } }),
				hashPassword: (plain) => bcrypt.hash(plain, 10),
				updateUserPassword: (userId, password) =>
					db.user
						.update({ where: { id: userId }, data: { password } })
						.then(() => undefined),
				now: () => new Date(),
			},
			validation.data as ResetPasswordInput,
		);

		if (!result.ok) {
			return NextResponse.json(
				{ error: result.error.message },
				{ status: result.error.status },
			);
		}

		return NextResponse.json(result.data);
	} catch (error: unknown) {
		console.error("Erro ao redefinir senha:", error);
		const message =
			error instanceof Error
				? error.message
				: "Erro ao redefinir senha. Tente novamente.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
