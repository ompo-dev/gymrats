/**
 * Factory unificada para contexto de autenticação (gym e student).
 *
 * Centraliza: Better Auth primeiro, fallback para token manual via getSessionToken.
 * gym-context e student-context delegam para esta factory.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { getSessionToken } from "@/lib/utils/get-session-token";
import { getSession } from "@/lib/utils/session";

export type AuthSession = {
  session: Record<string, string | number | boolean | object | null>;
  user: {
    id: string;
    student?: Record<string, string | number | boolean | object | null>;
    gyms?: { id: string }[];
    role?: string;
    activeGymId?: string;
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
  student: Record<string, string | number | boolean | object | null>;
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
  const headerList = await import("next/headers").then((m) => m.headers());

  // 1. Tentar Better Auth primeiro
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

  // 2. Fallback: token manual
  const sessionToken = await getSessionToken();
  if (!sessionToken) return null;

  const session = await getSession(sessionToken);
  if (!session?.user) return null;

  return {
    session,
    user: session.user,
  };
}

export async function getAuthContext(options: {
  type: "gym";
}): Promise<GymContextResult>;
export async function getAuthContext(options: {
  type: "student";
}): Promise<StudentContextResult>;
export async function getAuthContext(options: {
  type: "personal";
}): Promise<PersonalContextResult>;
export async function getAuthContext(options: {
  type: "gym" | "student" | "personal";
}): Promise<GymContextResult | StudentContextResult | PersonalContextResult> {
  const auth = await getAuthSession();
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
      } else {
        const created = await db.personal.create({
          data: {
            userId: user.id,
            name: (user.name as string) || "Personal",
            email: (user.email as string) || "",
          },
          select: { id: true },
        });
        personalId = created.id;
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
      } else {
        const newGym = await db.gym.create({
          data: {
            userId: user.id,
            name: user.name || "Admin Gym",
            address: "",
            phone: "",
            email: user.email,
            isActive: true,
          },
        });
        gymId = newGym.id;
        await db.user.update({
          where: { id: user.id },
          data: { activeGymId: gymId },
        });
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
    if (!student) {
      student = await db.student.create({ data: { userId: user.id } });
    }
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
