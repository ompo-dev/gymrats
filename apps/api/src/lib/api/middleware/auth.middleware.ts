/**
 * Middleware de Autenticacao
 *
 * Centraliza a logica de autenticacao para todas as rotas da API
 */

import { resolveAuthSessionFromRequest } from "@/lib/auth/session-resolver";
import { type NextRequest, NextResponse } from "@/runtime/next-server";
import { SESSION_COOKIE_NAMES } from "@gymrats/domain/auth-tokens";
import { getRequestContextCookie } from "../../runtime/request-context";

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

export interface StudentAuthResult extends AuthResult {
  user: AuthResult["user"] & {
    studentId: string;
    student: { id: string };
  };
}

export interface PersonalAuthResult extends AuthResult {
  user: AuthResult["user"] & {
    personalId: string;
    personal: { id: string };
  };
}

/**
 * Extrai o token de autenticacao do request
 */
export function extractAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  const cookieToken = SESSION_COOKIE_NAMES.map((cookieName) =>
    request.cookies.get(cookieName)?.value,
  ).find((value): value is string => Boolean(value));
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
    const result = await resolveAuthSessionFromRequest(request);

    if (!result.ok) {
      const sessionToken =
        extractAuthToken(request) ||
        SESSION_COOKIE_NAMES.map((cookieName) =>
          getRequestContextCookie(cookieName),
        ).find((value): value is string => Boolean(value));
      return {
        response: NextResponse.json(
          { error: sessionToken ? "Sessao invalida" : "Nao autenticado" },
          { status: result.error.status },
        ),
        error: result.error.message,
      };
    }

    return {
      userId: result.data.user.id,
      session: {
        id: result.data.session.id,
        token: result.data.session.token,
      },
      user: {
        ...result.data.user,
        student: result.data.user.student || undefined,
        personal: result.data.user.personal || undefined,
        gyms: result.data.user.gyms || [],
      },
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
): Promise<StudentAuthResult | AuthError> {
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

    if (existingStudent) {
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
): Promise<PersonalAuthResult | AuthError> {
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

    if (existingPersonal) {
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
