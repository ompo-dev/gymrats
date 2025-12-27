/**
 * Middleware de Autenticação
 * 
 * Centraliza a lógica de autenticação para todas as rotas da API
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/utils/session";
import { cookies } from "next/headers";

export interface AuthResult {
  userId: string;
  session: any;
  user: any;
}

export interface AuthError {
  response: NextResponse;
  error: string;
}

/**
 * Extrai o token de autenticação do request
 */
export function extractAuthToken(request: NextRequest): string | null {
  // Tentar pegar do cookie primeiro
  const cookieToken = request.cookies.get("auth_token")?.value;
  if (cookieToken) return cookieToken;

  // Tentar pegar do header Authorization
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }

  return null;
}

/**
 * Valida a autenticação e retorna os dados do usuário
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthResult | AuthError> {
  try {
    // Tentar pegar token do request primeiro
    let sessionToken = extractAuthToken(request);

    // Se não encontrou no request, tentar do cookies() do Next.js
    if (!sessionToken) {
      const cookieStore = await cookies();
      sessionToken = cookieStore.get("auth_token")?.value || null;
    }

    if (!sessionToken) {
      return {
        response: NextResponse.json(
          { error: "Não autenticado" },
          { status: 401 }
        ),
        error: "Token não fornecido",
      };
    }

    const session = await getSession(sessionToken);

    if (!session) {
      return {
        response: NextResponse.json(
          { error: "Sessão inválida" },
          { status: 401 }
        ),
        error: "Sessão inválida ou expirada",
      };
    }

    return {
      userId: session.userId,
      session,
      user: session.user,
    };
  } catch (error: any) {
    console.error("[requireAuth] Erro:", error);
    return {
      response: NextResponse.json(
        { error: "Erro ao validar autenticação" },
        { status: 500 }
      ),
      error: error.message || "Erro desconhecido",
    };
  }
}

/**
 * Valida se o usuário é um student
 * ADMIN tem acesso completo, então também passa por aqui
 */
export async function requireStudent(
  request: NextRequest
): Promise<AuthResult | AuthError> {
  const auth = await requireAuth(request);

  if ("error" in auth) {
    return auth;
  }

  // ADMIN tem acesso completo a tudo
  const isAdmin = auth.user?.role === "ADMIN";

  if (!isAdmin && !auth.user?.student) {
    return {
      response: NextResponse.json(
        { error: "Usuário não é um aluno" },
        { status: 403 }
      ),
      error: "Acesso negado: requer role STUDENT ou ADMIN",
    };
  }

  // O getSession já cria o student para ADMIN se não existir (ver lib/utils/session.ts)
  // Então o student deveria estar disponível aqui
  const studentId = auth.user?.student?.id;

  return {
    ...auth,
    user: {
      ...auth.user,
      studentId: studentId,
      // Garantir que student esteja disponível para handlers que usam auth.user.student.id
      student: auth.user?.student || (studentId ? { id: studentId } : undefined),
    },
  };
}

/**
 * Valida se o usuário é uma gym
 * ADMIN tem acesso completo, então também passa por aqui
 */
export async function requireGym(
  request: NextRequest
): Promise<AuthResult | AuthError> {
  const auth = await requireAuth(request);

  if ("error" in auth) {
    return auth;
  }

  // ADMIN tem acesso completo a tudo
  const isAdmin = auth.user?.role === "ADMIN";

  if (!isAdmin && (!auth.user?.gyms || auth.user.gyms.length === 0)) {
    return {
      response: NextResponse.json(
        { error: "Usuário não possui academias" },
        { status: 403 }
      ),
      error: "Acesso negado: requer role GYM ou ADMIN",
    };
  }

  return auth;
}

/**
 * Valida se o usuário é um ADMIN
 * Apenas usuários com role ADMIN têm acesso
 */
export async function requireAdmin(
  request: NextRequest
): Promise<AuthResult | AuthError> {
  const auth = await requireAuth(request);

  if ("error" in auth) {
    return auth;
  }

  const isAdmin = auth.user?.role === "ADMIN";

  if (!isAdmin) {
    return {
      response: NextResponse.json(
        { error: "Acesso negado: requer role ADMIN" },
        { status: 403 }
      ),
      error: "Acesso negado: requer role ADMIN",
    };
  }

  return auth;
}

