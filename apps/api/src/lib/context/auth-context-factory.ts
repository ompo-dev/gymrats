/**
 * Factory unificada para contexto de autenticação (gym e student).
 *
 * Centraliza: token explicito primeiro, com fallback para Better Auth.
 * gym-context e student-context delegam para esta factory.
 */

import { NextResponse } from "@/runtime/next-server";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { getRequestContextHeaders } from "../runtime/request-context";
import { getSessionTokenFromRequest } from "../utils/get-session-token";
import { getSession } from "@/lib/utils/session";

type AuthRecord = Record<string, string | number | boolean | object | null>;
type AuthStudentRecord = AuthRecord & { id: string };

export type AuthSession = {
  session: AuthRecord;
  user: {
    id: string;
    student?: AuthStudentRecord | null;
    gyms?: { id: string }[];
    role?: string;
    activeGymId?: string;
    name?: string;
    email?: string;
    [key: string]: string | number | boolean | object | null | undefined;
  };
};

export type GymContext = {
  gymId: string;
  session: AuthSession["session"];
  user: AuthSession["user"];
};

export type StudentContext = {
  studentId: string;
  session: AuthSession["session"];
  user: AuthSession["user"];
  student: AuthStudentRecord;
};

export type PersonalContext = {
  personalId: string;
  session: AuthSession["session"];
  user: AuthSession["user"];
};

export type GymContextResult =
  | { ctx: GymContext; errorResponse?: undefined }
  | { ctx?: undefined; errorResponse: NextResponse };

export type StudentContextResult =
  | { ctx: StudentContext; error?: undefined }
  | { ctx?: undefined; error: string };

export type PersonalContextResult =
  | { ctx: PersonalContext; errorResponse?: undefined }
  | { ctx?: undefined; errorResponse: NextResponse };

export type UserOnlyContext = {
  user: AuthSession["user"];
  session: AuthSession["session"];
};

export type UserOnlyContextResult =
  | { ctx: UserOnlyContext; error?: undefined }
  | { ctx?: undefined; error: string };

async function getAuthSession(): Promise<AuthSession | null> {
  return getAuthSessionFromHeaders(getRequestContextHeaders());
}

async function getAuthSessionFromHeaders(
  headers: Headers | null | undefined,
): Promise<AuthSession | null> {
  const headerList = headers ? new Headers(headers) : new Headers();
  const explicitSessionToken = getSessionTokenFromRequest({
    headers: headerList,
    cookies: {
      get(name: string) {
        const cookieHeader = headerList.get("cookie");
        if (!cookieHeader) return undefined;

        for (const chunk of cookieHeader.split(";")) {
          const [rawName, ...rest] = chunk.trim().split("=");
          if (rawName === name) {
            return {
              name,
              value: decodeURIComponent(rest.join("=")),
            };
          }
        }

        return undefined;
      },
    },
  } as Parameters<typeof getSessionTokenFromRequest>[0]);

  if (explicitSessionToken) {
    const sessionFromToken = await getSession(explicitSessionToken);

    if (sessionFromToken?.user) {
      return {
        session: sessionFromToken,
        user: sessionFromToken.user as unknown as AuthSession["user"],
      };
    }
  }

  // 1. Fallback para Better Auth
  try {
    const { auth } = await import("@/lib/auth-config");
    const betterAuthSession = await auth.api.getSession({
      headers: headerList,
    });

    if (betterAuthSession?.user) {
      const user = await db.user.findUnique({
        where: { id: betterAuthSession.user.id },
        include: {
          student: true,
          gyms: { select: { id: true } },
          personal: { select: { id: true } },
        },
      });

      if (user) {
        return {
          session: betterAuthSession.session as AuthSession["session"],
          user: user as unknown as AuthSession["user"],
        };
      }
    }
  } catch (err) {
    log.debug("[auth-context-factory] Better Auth não encontrou sessão", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return null;
}

export async function getAuthContext(options: {
  type: "gym";
}, headers?: Headers | null): Promise<GymContextResult>;
export async function getAuthContext(options: {
  type: "student";
}, headers?: Headers | null): Promise<StudentContextResult>;
export async function getAuthContext(options: {
  type: "personal";
}, headers?: Headers | null): Promise<PersonalContextResult>;
export async function getAuthContext(options: {
  type: "gym" | "student" | "personal";
}, headers?: Headers | null): Promise<GymContextResult | StudentContextResult | PersonalContextResult> {
  const auth = await getAuthSessionFromHeaders(headers ?? getRequestContextHeaders());
  if (!auth) {
    if (options.type === "gym" || options.type === "personal") {
      return {
        errorResponse: NextResponse.json(
          { error: "Não autenticado" },
          { status: 401 },
        ),
      };
    }
    return { error: "Não autenticado." };
  }

  const { session, user } = auth;

  if (options.type === "personal") {
    const isAdmin = user.role === "ADMIN";
    const isPersonalRole = user.role === "PERSONAL";
    if (!isAdmin && !isPersonalRole) {
      return {
        errorResponse: NextResponse.json(
          { error: "Usuário não é um personal" },
          { status: 403 },
        ),
      };
    }
    const userWithPersonal = await db.user.findUnique({
      where: { id: user.id },
      include: { personal: { select: { id: true } } },
    });
    let personalId = (userWithPersonal?.personal as { id: string } | null)?.id;
    if (!personalId && (isAdmin || isPersonalRole)) {
      const existing = await db.personal.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (existing) {
        personalId = existing.id;
      }
    }
    if (!personalId) {
      return {
        errorResponse: NextResponse.json(
          { error: "Personal ID não encontrado" },
          { status: 500 },
        ),
      };
    }
    return {
      ctx: { personalId, session, user },
    };
  }

  if (options.type === "gym") {
    const isAdmin = user.role === "ADMIN";
    let gymId = user.activeGymId || user.gyms?.[0]?.id;

    if (isAdmin && !gymId) {
      const existingGym = await db.gym.findFirst({
        where: { userId: user.id },
      });
      if (existingGym) {
        gymId = existingGym.id;
      }
    }

    if (!gymId) {
      return {
        errorResponse: NextResponse.json(
          { error: "Academia não encontrada" },
          { status: 403 },
        ),
      };
    }

    return {
      ctx: { gymId, session, user },
    };
  }

  // type === "student"
  const isAdmin = user.role === "ADMIN";
  let student = user.student;

  if (isAdmin && !student) {
    student = await db.student.findUnique({ where: { userId: user.id } });
  }

  if (!student) {
    return { error: "Perfil de aluno não encontrado." };
  }

  return {
    ctx: {
      studentId: student.id,
      session,
      user,
      student,
    },
  };
}

/** Retorna apenas o usuário autenticado, sem exigir student/gym. Útil para PENDING. */
export async function getUserContext(): Promise<UserOnlyContextResult> {
  const auth = await getAuthSession();
  if (!auth) return { error: "Não autenticado." };
  return { ctx: { user: auth.user, session: auth.session } };
}
