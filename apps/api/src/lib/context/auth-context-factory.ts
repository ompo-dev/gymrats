/**
 * Factory unificada para contexto de autenticacao (gym, student e personal).
 *
 * Centraliza a resolucao de sessao compartilhando o mesmo hot path usado
 * por requireAuth e /api/auth/session.
 */

import { resolveAuthSessionFromHeaders } from "@/lib/auth/session-resolver";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { NextResponse } from "@/runtime/next-server";
import { getRequestContextHeaders } from "../runtime/request-context";

type AuthRecord = Record<string, string | number | boolean | object | null>;
type AuthStudentRecord = AuthRecord & { id: string };

export type AuthSession = {
  session: AuthRecord;
  user: {
    id: string;
    student?: AuthStudentRecord | null;
    personal?: { id: string } | null;
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
  const result = await resolveAuthSessionFromHeaders(headers ?? undefined);

  if (!result.ok) {
    log.debug("[auth-context-factory] Nenhuma sessao encontrada", {
      error: result.error.message,
    });
    return null;
  }

  return {
    session: result.data.session as AuthSession["session"],
    user: result.data.user as AuthSession["user"],
  };
}

export async function getAuthContext(
  options: {
    type: "gym";
  },
  headers?: Headers | null,
): Promise<GymContextResult>;
export async function getAuthContext(
  options: {
    type: "student";
  },
  headers?: Headers | null,
): Promise<StudentContextResult>;
export async function getAuthContext(
  options: {
    type: "personal";
  },
  headers?: Headers | null,
): Promise<PersonalContextResult>;
export async function getAuthContext(
  options: {
    type: "gym" | "student" | "personal";
  },
  headers?: Headers | null,
): Promise<GymContextResult | StudentContextResult | PersonalContextResult> {
  const auth = await getAuthSessionFromHeaders(
    headers ?? getRequestContextHeaders(),
  );
  if (!auth) {
    if (options.type === "gym" || options.type === "personal") {
      return {
        errorResponse: NextResponse.json(
          { error: "Nao autenticado" },
          { status: 401 },
        ),
      };
    }
    return { error: "Nao autenticado." };
  }

  const { session, user } = auth;

  if (options.type === "personal") {
    const isAdmin = user.role === "ADMIN";
    const isPersonalRole = user.role === "PERSONAL";
    if (!isAdmin && !isPersonalRole) {
      return {
        errorResponse: NextResponse.json(
          { error: "Usuario nao e um personal" },
          { status: 403 },
        ),
      };
    }

    let personalId = (user.personal as { id: string } | null | undefined)?.id;
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
          { error: "Personal ID nao encontrado" },
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
          { error: "Academia nao encontrada" },
          { status: 403 },
        ),
      };
    }

    return {
      ctx: { gymId, session, user },
    };
  }

  const isAdmin = user.role === "ADMIN";
  let student = user.student;

  if (isAdmin && !student) {
    student = (await db.student.findUnique({
      where: { userId: user.id },
    })) as AuthStudentRecord | null;
  }

  if (!student) {
    return { error: "Perfil de aluno nao encontrado." };
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

export async function getUserContext(): Promise<UserOnlyContextResult> {
  const auth = await getAuthSession();
  if (!auth) return { error: "Nao autenticado." };
  return { ctx: { user: auth.user, session: auth.session } };
}
