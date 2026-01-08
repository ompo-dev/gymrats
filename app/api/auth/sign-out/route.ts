import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { getSessionTokenFromRequest, deleteSession } from "@/lib/utils/session";
import { getCookie, deleteCookie } from "@/lib/utils/cookies";

export async function POST(request: NextRequest) {
  try {
    // Primeiro tentar fazer logout do Better Auth
    try {
      await auth.api.signOut({
        headers: request.headers,
      });

      // Limpar cookies do Better Auth
      const response = NextResponse.json({ success: true });
      response.cookies.delete("better-auth.session_token");
      response.cookies.delete("auth_token");

      return response;
    } catch (betterAuthError) {
      // Se falhar, tentar método antigo (compatibilidade)
      console.log(
        "[sign-out] Better Auth logout falhou, tentando método antigo"
      );
    }

    // Fallback: método antigo (compatibilidade)
    let sessionToken = getSessionTokenFromRequest(request);

    if (!sessionToken) {
      sessionToken = await getCookie("auth_token");
    }

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 }
      );
    }

    if (sessionToken) {
      await deleteSession(sessionToken);
    }

    await deleteCookie("auth_token");

    const response = NextResponse.json({ success: true });
    response.cookies.delete("auth_token");
    response.cookies.delete("better-auth.session_token");

    return response;
  } catch (error: any) {
    console.error("Erro ao fazer logout:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao fazer logout" },
      { status: 500 }
    );
  }
}
