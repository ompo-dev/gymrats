import { NextRequest, NextResponse } from "next/server";
import { getSessionTokenFromRequest } from "@/lib/utils/session";
import { getSession } from "@/lib/utils/session";
import { getCookie } from "@/lib/utils/cookies";

export async function GET(request: NextRequest) {
  try {
    // Primeiro tentar pegar do header Authorization (Bearer token)
    let sessionToken = getSessionTokenFromRequest(request);

    // Se não encontrou no header, tentar pegar do cookie
    if (!sessionToken) {
      const cookieStore = await getCookie("auth_token");
      sessionToken = cookieStore || null;
    }

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 }
      );
    }

    // Limpar espaços em branco e trim
    sessionToken = sessionToken.trim();

    // Debug: log do token (apenas em desenvolvimento)
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[session] Token recebido:",
        sessionToken.substring(0, 20) + "..."
      );
    }

    const session = await getSession(sessionToken);

    if (!session) {
      // Debug: log de erro (apenas em desenvolvimento)
      if (process.env.NODE_ENV === "development") {
        console.error(
          "[session] Sessão não encontrada para token:",
          sessionToken.substring(0, 20) + "..."
        );
      }
      return NextResponse.json(
        { error: "Sessão inválida ou expirada" },
        { status: 401 }
      );
    }

    // ADMIN tem acesso completo: tem tanto student quanto gym
    const isAdmin = session.user.role === "ADMIN";
    const hasGym =
      isAdmin || (session.user.gyms && session.user.gyms.length > 0);
    const hasStudent = isAdmin || !!session.user.student;

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role, // Fonte da verdade: STUDENT, GYM ou ADMIN
        hasGym,
        hasStudent,
        createdAt: session.user.createdAt, // Data de criação para formatar memberSince
      },
      session: {
        id: session.id,
        token: session.sessionToken,
      },
    });
  } catch (error: any) {
    console.error("Erro ao buscar sessão:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar sessão" },
      { status: 500 }
    );
  }
}
