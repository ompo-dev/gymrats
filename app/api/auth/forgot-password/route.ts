import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/api/schemas";
import { validateBody } from "@/lib/api/middleware/validation.middleware";
import { sendResetPasswordEmail } from "@/lib/services/email.service";

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

    const { email } = validation.data;

    // Buscar usuário
    const user = await db.user.findUnique({
      where: { email },
    });

    // Sempre retornar sucesso para não expor se o email existe ou não
    // Mas só enviar email se o usuário existir
    if (user) {
      // Gerar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Expira em 15 minutos
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 15);

      // Deletar tokens anteriores para este email
      await db.verificationToken.deleteMany({
        where: {
          identifier: `reset-password:${email}`,
        },
      });

      // Salvar novo token de verificação
      await db.verificationToken.create({
        data: {
          identifier: `reset-password:${email}`,
          token: code,
          expires,
        },
      });

      // Enviar email com código
      try {
        await sendResetPasswordEmail({
          to: user.email,
          name: user.name,
          code,
        });
      } catch (emailError) {
        console.error("Erro ao enviar email de recuperação:", emailError);
        // Continuar mesmo se o email falhar (segurança)
      }
    }

    // Sempre retornar sucesso (security best practice)
    return NextResponse.json({
      message: "Se o email estiver cadastrado, você receberá um código de verificação.",
    });
  } catch (error: any) {
    console.error("Erro ao processar solicitação de recuperação de senha:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação. Tente novamente." },
      { status: 500 }
    );
  }
}

