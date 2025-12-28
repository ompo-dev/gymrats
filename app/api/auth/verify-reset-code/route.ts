import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyResetCodeSchema } from "@/lib/api/schemas";
import { validateBody } from "@/lib/api/middleware/validation.middleware";

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

    const { email, code } = validation.data;

    // Buscar token de verificação
    const verificationToken = await db.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: `reset-password:${email}`,
          token: code,
        },
      },
    });

    // Verificar se existe e não expirou
    if (!verificationToken) {
      return NextResponse.json(
        { error: "Código inválido" },
        { status: 400 }
      );
    }

    if (new Date() > verificationToken.expires) {
      // Remover token expirado
      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: `reset-password:${email}`,
            token: code,
          },
        },
      });

      return NextResponse.json(
        { error: "Código expirado. Solicite um novo código." },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Código válido
    return NextResponse.json({
      valid: true,
      message: "Código verificado com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao verificar código:", error);
    return NextResponse.json(
      { error: "Erro ao verificar código. Tente novamente." },
      { status: 500 }
    );
  }
}

