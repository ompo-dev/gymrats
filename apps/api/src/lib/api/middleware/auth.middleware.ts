/**
 * Middleware de Autenticacao
 *
 * Centraliza a logica de autenticacao para todas as rotas da API
 */

import { type NextRequest, NextResponse } from "@/runtime/next-server";
import { getRequestContextCookie } from "../../runtime/request-context";
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
 * Extrai o token de autenticacao do request
 */
export function extractAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  const cookieToken =
    request.cookies.get("auth_token")?.value ||
    request.cookies.get("better-auth.session_token")?.value;
  if (cookieToken) return cookieToken;

  return null;
}

/**
 * Valida a autenticacao e retorna os dados do usuario
 */
export async function requireAuth(
  request: NextRequest,
): Promise<AuthResult | AuthError> {
  try {
    let sessionToken = extractAuthToken(request);

    if (!sessionToken) {
      sessionToken =
        getRequestContextCookie("auth_token") ||
        getRequestContextCookie("better-auth.session_token");
    }

    if (sessionToken) {
      const session = await getSession(sessionToken);

      if (session) {
        return {
          userId: session.userId,
          session,
          user: session.user,
        };
      }
    }

    try {
      const { auth } = await import("@/lib/auth-config");
      const betterAuthSession = await auth.api.getSession({
        headers: request.headers,
      });

      if (betterAuthSession?.user) {
        const { db } = await import("@/lib/db");
        const user = await db.user.findUnique({
          where: { id: betterAuthSession.user.id },
          include: {
            student: {
              select: {
                id: true,
                subscription: {
                  select: {
                    plan: true,
                    status: true,
                    trialEnd: true,
                    currentPeriodEnd: true,
                  },
                },
              },
            },
            personal: { select: { id: true } },
            gyms: {
              select: {
                id: true,
                plan: true,
                subscription: {
                  select: {
                    plan: true,
                    status: true,
                    currentPeriodEnd: true,
                  },
                },
              },
            },
          },
        });

        if (user) {
          return {
            userId: user.id,
            session: {
              id: betterAuthSession.session?.id || "",
              userId: user.id,
              user,
            } as Record<string, string | number | boolean | object | null>,
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
      console.log(
        "[requireAuth] Better Auth nao encontrou sessao, tentando metodo antigo",
      );
    }

    if (sessionToken) {
      return {
        response: NextResponse.json(
          { error: "Sessao invalida" },
          { status: 401 },
        ),
        error: "Sessao invalida ou expirada",
      };
    }

    return {
      response: NextResponse.json(
        { error: "Nao autenticado" },
        { status: 401 },
      ),
      error: "Token nao fornecido",
    };
  } catch (error) {
    console.error("[requireAuth] Erro:", error);
    return {
      response: NextResponse.json(
        { error: "Erro ao validar autenticacao" },
        { status: 500 },
      ),
      error: (error as Error).message || "Erro desconhecido",
    };
  }
}

/**
 * Valida se o usuario e um student
 * ADMIN tem acesso completo, entao tambem passa por aqui
 */
export async function requireStudent(
  request: NextRequest,
): Promise<AuthResult | AuthError> {
  const auth = await requireAuth(request);

  if ("error" in auth) {
    return auth;
  }

  const isAdmin = auth.user?.role === "ADMIN";
  const isGym = auth.user?.role === "GYM";

  if (!isAdmin && !isGym && !auth.user?.student) {
    return {
      response: NextResponse.json(
        { error: "Usuario nao e um aluno" },
        { status: 403 },
      ),
      error: "Acesso negado: requer role STUDENT, GYM ou ADMIN",
    };
  }

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
        { error: "Student ID nao encontrado" },
        { status: 500 },
      ),
      error: "Student ID nao disponivel",
    };
  }

  return {
    ...auth,
    user: {
      ...auth.user,
      studentId,
      student: student || { id: studentId },
    },
  };
}

/**
 * Valida se o usuario e uma gym
 * ADMIN tem acesso completo, entao tambem passa por aqui
 */
export async function requireGym(
  request: NextRequest,
): Promise<AuthResult | AuthError> {
  const auth = await requireAuth(request);

  if ("error" in auth) {
    return auth;
  }

  const isAdmin = auth.user?.role === "ADMIN";

  if (!isAdmin && (!auth.user?.gyms || auth.user.gyms.length === 0)) {
    return {
      response: NextResponse.json(
        { error: "Usuario nao possui academias" },
        { status: 403 },
      ),
      error: "Acesso negado: requer role GYM ou ADMIN",
    };
  }

  return auth;
}

/**
 * Valida se o usuario e um personal
 * ADMIN tem acesso completo, entao tambem passa por aqui
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
        { error: "Usuario nao e um personal" },
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
        { error: "Personal ID nao encontrado" },
        { status: 500 },
      ),
      error: "Personal ID nao disponivel",
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
 * Valida se o usuario e um ADMIN
 * Apenas usuarios com role ADMIN tem acesso
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
