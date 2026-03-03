import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";

/**
 * GET /r/[code]
 *
 * Route Handler (não Server Component) — pode usar cookies().set()
 *
 * Fluxo:
 * 1. Salva gymrats_referral em cookie
 * 2. Se logado como STUDENT → /student?tab=payments&subTab=subscription
 * 3. Se logado como GYM    → /gym?tab=financial&subTab=subscription
 * 4. Não logado            → /welcome
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

  // Determinar destino com base no role
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
          destination = "/student?tab=payments&subTab=subscription";
        }
      } else if (role === "GYM") {
        destination = "/gym?tab=financial&subTab=subscription";
      }
    } catch {
      // Sessão inválida — vai para welcome
    }
  }

  const response = NextResponse.redirect(new URL(destination, req.url));

  // Salvar cookie (funciona em Route Handlers)
  response.cookies.set("gymrats_referral", refValue, {
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });

  return response;
}
