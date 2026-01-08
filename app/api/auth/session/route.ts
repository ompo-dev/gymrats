import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { getSessionTokenFromRequest } from "@/lib/utils/session";
import { getSession } from "@/lib/utils/session";
import { getCookie } from "@/lib/utils/cookies";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Primeiro tentar buscar sessão do Better Auth
    try {
      const betterAuthSession = await auth.api.getSession({
        headers: request.headers,
      });

      if (betterAuthSession?.user) {
        // Sessão do Better Auth encontrada
        const user = await db.user.findUnique({
          where: { id: betterAuthSession.user.id },
          include: {
            student: { select: { id: true } },
            gyms: { select: { id: true } },
          },
        });

        if (user) {
          // ADMIN tem acesso completo: tem tanto student quanto gym
          const isAdmin = user.role === "ADMIN";
          const hasGym = isAdmin || (user.gyms && user.gyms.length > 0);
          const hasStudent = isAdmin || !!user.student;

          // Buscar token de sessão do Better Auth para compatibilidade
          // O Better Auth armazena o token no cookie better-auth.session_token
          // Mas também podemos obter do objeto session retornado ou buscar do banco
          const betterAuthToken = request.cookies.get(
            "better-auth.session_token"
          )?.value;
          const authHeaderToken = request.headers
            .get("authorization")
            ?.replace("Bearer ", "");

          // Se não encontrou no cookie ou header, buscar do banco usando o session.id
          let sessionToken = betterAuthToken || authHeaderToken;

          if (!sessionToken && betterAuthSession.session?.id) {
            const sessionFromDb = await db.session.findUnique({
              where: { id: betterAuthSession.session.id },
              select: { token: true },
            });
            sessionToken = sessionFromDb?.token || "";
          }

          // Se ainda não encontrou, usar o session.id como fallback
          if (!sessionToken) {
            sessionToken = betterAuthSession.session?.id || "";
          }

          // Criar resposta e sincronizar cookie auth_token para compatibilidade
          const response = NextResponse.json({
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role, // Fonte da verdade: STUDENT, GYM ou ADMIN
              hasGym,
              hasStudent,
              createdAt: user.createdAt,
            },
            session: {
              id: betterAuthSession.session?.id || "",
              token: sessionToken,
            },
          });

          // Sincronizar token do Better Auth para cookie auth_token (compatibilidade)
          // Sempre sincronizar para garantir que o cookie auth_token esteja presente
          if (sessionToken) {
            response.cookies.set("auth_token", sessionToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 30, // 30 dias
              path: "/",
            });
          }

          return response;
        }
      }
    } catch (betterAuthError) {
      // Se falhar com Better Auth, tentar método antigo (compatibilidade)
      console.log(
        "[session] Better Auth não encontrou sessão, tentando método antigo"
      );
    }

    // Fallback: tentar método antigo (sessão customizada) para compatibilidade
    let sessionToken = getSessionTokenFromRequest(request);

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

    sessionToken = sessionToken.trim();

    const session = await getSession(sessionToken);

    if (!session) {
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
        role: session.user.role,
        hasGym,
        hasStudent,
        createdAt: session.user.createdAt,
      },
      session: {
        id: session.id,
        token: session.token || session.sessionToken || "",
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
