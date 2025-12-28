import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { resetPasswordSchema } from "@/lib/api/schemas";
import { validateBody } from "@/lib/api/middleware/validation.middleware";

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

    const { email, code, newPassword } = validation.data;

    // Verificar código
    const verificationToken = await db.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: `reset-password:${email}`,
          token: code,
        },
      },
    });

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

    // Buscar usuário
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Remover token usado
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: `reset-password:${email}`,
          token: code,
        },
      },
    });

    // Opcional: invalidar todas as sessões do usuário
    // await db.session.deleteMany({
    //   where: { userId: user.id },
    // });

    return NextResponse.json({
      message: "Senha redefinida com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { error: "Erro ao redefinir senha. Tente novamente." },
      { status: 500 }
    );
  }
}

