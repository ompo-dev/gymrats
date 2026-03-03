import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ReferralService } from "@/lib/services/referral.service";
import { getSession } from "@/lib/utils/session";

/**
 * GET /r/[code]
 *
 * Route Handler — salva o referral code em cookie E já cria o registro
 * PENDING no banco se o usuário estiver logado. Isso garante a comissão
 * mesmo que o cookie expire antes do pagamento.
 *
 * Fluxo:
 * 1. Salva gymrats_referral em cookie (30 dias)
 * 2. Se logado → tenta criar referral PENDING imediatamente
 * 3. Se logado como STUDENT → /student?tab=payments&subTab=subscription
 * 4. Se logado como GYM    → /gym?tab=financial&subTab=subscription
 * 5. Não logado            → /welcome (cookie salvo; resolve ao logar)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const refValue = code.startsWith("@") ? code : `@${code}`;

  const authToken =
    req.cookies.get("auth_token")?.value ||
    req.cookies.get("better-auth.session_token")?.value;

  let destination = "/welcome";

  if (authToken) {
    try {
      const session = await getSession(authToken);
      const role = session?.user?.role;

      if (role === "STUDENT" || role === "ADMIN") {
        const student = await db.student.findUnique({
          where: { userId: session!.user.id },
          select: { id: true },
        });
        if (student) {
          // Cria PENDING imediatamente — cookie pode expirar antes do pagamento
          await ReferralService.resolveReferral(refValue, "STUDENT", student.id).catch(() => null);
          destination = "/student?tab=payments&subTab=subscription";
        }
      } else if (role === "GYM") {
        const gym = await db.gym.findFirst({
          where: { userId: session!.user.id },
          select: { id: true },
        });
        if (gym) {
          // Cria PENDING imediatamente para gym
          await ReferralService.resolveReferral(refValue, "GYM", gym.id).catch(() => null);
          destination = "/gym?tab=financial&subTab=subscription";
        }
      }
    } catch {
      // Sessão inválida — vai para welcome
    }
  }

  const response = NextResponse.redirect(new URL(destination, req.url));

  // Salvar cookie como fallback para usuários não-logados
  response.cookies.set("gymrats_referral", refValue, {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });

  return response;
}

