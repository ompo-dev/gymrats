import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { verifyResetCodeSchema } from "@/lib/api/schemas";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import {
  type VerifyResetCodeInput,
  verifyResetCodeUseCase,
} from "@/lib/use-cases/auth";
import { type NextRequest, NextResponse } from "@/runtime/next-server";

/**
 * POST /api/auth/verify-reset-code
 * Verifica se o codigo de recuperacao e valido
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
  } catch (error) {
    log.error("Erro ao verificar codigo", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
