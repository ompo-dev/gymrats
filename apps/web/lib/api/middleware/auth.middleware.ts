/**
 * Middleware de Autenticação
 *
 * Centraliza a lógica de autenticação para todas as rotas da API
 */

import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/utils/session";

export interface AuthResult {
  userId: string;
  session: Record<string, string | number | boolean | object | null>;
  user: {
    id: string;
    role?: string;
    student?: { id: string } | null;
    personal?: { id: string } | null;
    gyms?: { id: string }[] | null;
    [key: string]: string | number | boolean | object | null | undefined;
  };
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
  // Verificar ambos os cookies: auth_token (legacy) e better-auth.session_token (Better Auth)
  const cookieToken =
    request.cookies.get("auth_token")?.value ||
    request.cookies.get("better-auth.session_token")?.value;
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
  request: NextRequest,
): Promise<AuthResult | AuthError> {
  try {
    // Primeiro tentar validar via Better Auth (prioridade)
    try {
      const { auth } = await import("@/lib/auth-config");
      const betterAuthSession = await auth.api.getSession({
        headers: request.headers,
      });

      if (betterAuthSession?.user) {
        // Sessão do Better Auth encontrada - buscar dados completos do usuário
        const { db } = await import("@/lib/db");
        const user = await db.user.findUnique({
          where: { id: betterAuthSession.user.id },
          include: {
            student: { select: { id: true } },
            personal: { select: { id: true } },
            gyms: { select: { id: true } },
          },
        });

        if (user) {
          // Buscar sessão do banco para compatibilidade
          const sessionToken =
            request.cookies.get("better-auth.session_token")?.value ||
            request.cookies.get("auth_token")?.value;

          let session = null;
          if (sessionToken) {
            session = await getSession(sessionToken);
          }

          return {
            userId: user.id,
            session:
              session ||
              ({
                id: betterAuthSession.session?.id || "",
                userId: user.id,
                user,
              } as Record<string, string | number | boolean | object | null>),
            user: {
              ...user,
              student: user.student || undefined,
              personal: user.personal || undefined,
              gyms: user.gyms || [],
            },
          };
        }
      }
    } catch (_betterAuthError) {
      // Se falhar com Better Auth, continuar com método antigo
      console.log(
        "[requireAuth] Better Auth não encontrou sessão, tentando método antigo",
      );
    }

    // Fallback: método antigo (compatibilidade)
    // Tentar pegar token do request primeiro
    let sessionToken = extractAuthToken(request);

    // Se não encontrou no request, tentar do cookies() do Next.js
    if (!sessionToken) {
      const cookieStore = await cookies();
      // Verificar ambos os cookies: auth_token (legacy) e better-auth.session_token (Better Auth)
      sessionToken =
        cookieStore.get("auth_token")?.value ||
        cookieStore.get("better-auth.session_token")?.value ||
        null;
    }

    if (!sessionToken) {
      return {
        response: NextResponse.json(
          { error: "Não autenticado" },
          { status: 401 },
        ),
        error: "Token não fornecido",
      };
    }

    const session = await getSession(sessionToken);

    if (!session) {
      return {
        response: NextResponse.json(
          { error: "Sessão inválida" },
          { status: 401 },
        ),
        error: "Sessão inválida ou expirada",
      };
    }

    return {
      userId: session.userId,
      session,
      user: session.user,
    };
  } catch (error) {
    console.error("[requireAuth] Erro:", error);
    return {
      response: NextResponse.json(
        { error: "Erro ao validar autenticação" },
        { status: 500 },
      ),
      error: (error as Error).message || "Erro desconhecido",
    };
  }
}

/**
 * Valida se o usuário é um student
 * ADMIN tem acesso completo, então também passa por aqui
 */
export async function requireStudent(
  request: NextRequest,
): Promise<AuthResult | AuthError> {
  const auth = await requireAuth(request);

  if ("error" in auth) {
    return auth;
  }

  // ADMIN e GYM têm acesso completo para alternar
  const isAdmin = auth.user?.role === "ADMIN";
  const isGym = auth.user?.role === "GYM";

  if (!isAdmin && !isGym && !auth.user?.student) {
    return {
      response: NextResponse.json(
        { error: "Usuário não é um aluno" },
        { status: 403 },
      ),
      error: "Acesso negado: requer role STUDENT, GYM ou ADMIN",
    };
  }

  // Para ADMIN e GYM, garantir que student existe (criar se não existir)
  let studentId = auth.user?.student?.id;
  let student = auth.user?.student;

  if ((isAdmin || isGym) && !studentId) {
    const { db } = await import("@/lib/db");
    const existingStudent = await db.student.findUnique({
      where: { userId: auth.userId },
    });

    if (!existingStudent) {
      const newStudent = await db.student.create({
        data: {
          userId: auth.userId,
        },
      });
      studentId = newStudent.id;
      student = { id: newStudent.id };
    } else {
      studentId = existingStudent.id;
      student = { id: existingStudent.id };
    }
  }

  if (!studentId) {
    return {
      response: NextResponse.json(
        { error: "Student ID não encontrado" },
        { status: 500 },
      ),
      error: "Student ID não disponível",
    };
  }

  return {
    ...auth,
    user: {
      ...auth.user,
      studentId: studentId,
      // Garantir que student esteja disponível para handlers que usam auth.user.student.id
      student: student || { id: studentId },
    },
  };
}

/**
 * Valida se o usuário é uma gym
 * ADMIN tem acesso completo, então também passa por aqui
 */
export async function requireGym(
  request: NextRequest,
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
        { status: 403 },
      ),
      error: "Acesso negado: requer role GYM ou ADMIN",
    };
  }

  return auth;
}

/**
 * Valida se o usuário é um personal
 * ADMIN tem acesso completo, então também passa por aqui
 */
export async function requirePersonal(
  request: NextRequest,
): Promise<AuthResult | AuthError> {
  const auth = await requireAuth(request);

  if ("error" in auth) {
    return auth;
  }

  const isAdmin = auth.user?.role === "ADMIN";
  const isPersonalRole = auth.user?.role === "PERSONAL";

  if (!isAdmin && !isPersonalRole) {
    return {
      response: NextResponse.json(
        { error: "Usuário não é um personal" },
        { status: 403 },
      ),
      error: "Acesso negado: requer role PERSONAL ou ADMIN",
    };
  }

  let personalId = auth.user?.personal?.id;
  let personal = auth.user?.personal;

  if ((isAdmin || isPersonalRole) && !personalId) {
    const { db } = await import("@/lib/db");
    const existingPersonal = await db.personal.findUnique({
      where: { userId: auth.userId },
      select: { id: true },
    });

    if (!existingPersonal) {
      const userRecord = await db.user.findUnique({
        where: { id: auth.userId },
        select: { name: true, email: true },
      });
      const created = await db.personal.create({
        data: {
          userId: auth.userId,
          name: userRecord?.name || "Personal",
          email: userRecord?.email || "",
        },
        select: { id: true },
      });
      personalId = created.id;
      personal = { id: created.id };
    } else {
      personalId = existingPersonal.id;
      personal = { id: existingPersonal.id };
    }
  }

  if (!personalId) {
    return {
      response: NextResponse.json(
        { error: "Personal ID não encontrado" },
        { status: 500 },
      ),
      error: "Personal ID não disponível",
    };
  }

  return {
    ...auth,
    user: {
      ...auth.user,
      personalId,
      personal: personal || { id: personalId },
    },
  };
}

/**
 * Valida se o usuário é um ADMIN
 * Apenas usuários com role ADMIN têm acesso
 */
export async function requireAdmin(
  request: NextRequest,
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
        { status: 403 },
      ),
      error: "Acesso negado: requer role ADMIN",
    };
  }

  return auth;
}
