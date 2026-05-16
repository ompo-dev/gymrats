import { randomInt } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { forgotPasswordSchema } from "@/lib/api/schemas";
import { db } from "@/lib/db";
import { sendResetPasswordEmail } from "@/lib/services/email.service";
import {
	type ForgotPasswordInput,
	forgotPasswordUseCase,
} from "@/lib/use-cases/auth";

/**
 * POST /api/auth/forgot-password
 * Gera e envia código de recuperação de senha por email
 */
export async function POST(request: NextRequest) {
	try {
		const validation = await validateBody(request, forgotPasswordSchema);
		if (!validation.success) {
			return validation.response;
		}

		const result = await forgotPasswordUseCase(
			{
				findUserByEmail: (email) => db.user.findUnique({ where: { email } }),
				deleteTokensByIdentifier: (identifier) =>
					db.verificationToken
						.deleteMany({ where: { identifier } })
						.then(() => undefined),
				createVerificationToken: (data) =>
					db.verificationToken.create({ data }).then(() => undefined),
				sendResetPasswordEmail,
				generateResetCode: () => randomInt(100000, 1000000).toString(),
				now: () => new Date(),
			},
			validation.data as ForgotPasswordInput,
		);

		if (!result.ok) {
			return NextResponse.json(
				{ error: result.error.message },
				{ status: result.error.status },
			);
		}

		return NextResponse.json(result.data);
	} catch (error: unknown) {
		console.error(
			"Erro ao processar solicitação de recuperação de senha:",
			error,
		);
		const message =
			error instanceof Error
				? error.message
				: "Erro ao processar solicitação. Tente novamente.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
