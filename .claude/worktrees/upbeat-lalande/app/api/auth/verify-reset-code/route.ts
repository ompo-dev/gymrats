import { type NextRequest, NextResponse } from "next/server";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { verifyResetCodeSchema } from "@/lib/api/schemas";
import { db } from "@/lib/db";
import {
	type VerifyResetCodeInput,
	verifyResetCodeUseCase,
} from "@/lib/use-cases/auth";

/**
 * POST /api/auth/verify-reset-code
 * Verifica se o código de recuperação é válido
 */
export async function POST(request: NextRequest) {
	try {
		const validation = await validateBody(request, verifyResetCodeSchema);
		if (!validation.success) {
			return validation.response;
		}

		const result = await verifyResetCodeUseCase(
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
				now: () => new Date(),
			},
			validation.data as VerifyResetCodeInput,
		);

		if (!result.ok) {
			return NextResponse.json(
				{ error: result.error.message },
				{ status: result.error.status },
			);
		}

		return NextResponse.json(result.data);
	} catch (error: unknown) {
		console.error("Erro ao verificar código:", error);
		const message =
			error instanceof Error
				? error.message
				: "Erro ao verificar código. Tente novamente.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
