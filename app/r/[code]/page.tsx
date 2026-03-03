import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";

interface Props {
  params: Promise<{ code: string }>;
}

/**
 * Página de landing de indicação.
 * 
 * URL: /r/CODIGO
 * 
 * Fluxo:
 * 1. Salva o código em cookie (gymrats_referral)
 * 2. Se logado como STUDENT → /student?tab=payments&subTab=subscription
 * 3. Se logado como GYM    → /gym?tab=financial&subTab=subscription
 * 4. Se não logado         → /sign-in (cookie já foi salvo, redirect após login)
 */
export default async function ReferralLandingPage({ params }: Props) {
  const { code } = await params;

  // 1. Salvar ref em cookie (server-side, 30 dias)
  const cookieStore = await cookies();
  const refValue = code.startsWith("@") ? code : `@${code}`;
  cookieStore.set("gymrats_referral", refValue, {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    httpOnly: false, // precisa ser lido no client também
  });

  // 2. Detectar sessão
  const authToken = cookieStore.get("auth_token")?.value;
  const betterAuthToken = cookieStore.get("better-auth.session_token")?.value;
  const token = authToken || betterAuthToken;

  if (token) {
    try {
      const session = await getSession(token);
      if (session?.user) {
        const role = session.user.role;

        if (role === "STUDENT" || role === "ADMIN") {
          // Verifica se tem perfil de aluno
          const student = await db.student.findUnique({
            where: { userId: session.user.id },
          });
          if (student) {
            redirect("/student?tab=payments&subTab=subscription");
          }
        }

        if (role === "GYM") {
          redirect("/gym?tab=financial&subTab=subscription");
        }
      }
    } catch {
      // Sessão inválida, continua para login
    }
  }

  // 3. Não logado → vai para sign-in com redirect após login
  // O cookie já foi salvo, o redirect acontecerá após login/cadastro
  redirect("/sign-in");
}
