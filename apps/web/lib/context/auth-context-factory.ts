import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { getSession } from "@/lib/utils/session";

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

async function getRequestHeaders() {
  const headerList = await headers();
  return new Headers(headerList);
}

async function getSessionToken(): Promise<string | null> {
  const requestHeaders = await getRequestHeaders();
  const authHeader = requestHeaders.get("authorization");
  const cookieHeader = requestHeaders.get("cookie");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  if (cookieHeader) {
    for (const cookie of cookieHeader.split(";")) {
      const [rawKey, ...rest] = cookie.trim().split("=");
      if (rawKey === "auth_token" || rawKey === "better-auth.session_token") {
        return decodeURIComponent(rest.join("="));
      }
    }
  }

  return null;
}

async function getAuthSession(): Promise<AuthSession | null> {
  const requestHeaders = await getRequestHeaders();
  const explicitSessionToken = await getSessionToken();

  if (explicitSessionToken) {
    const sessionFromToken = await getSession(explicitSessionToken);

    if (sessionFromToken?.user) {
      return {
        session: sessionFromToken,
        user: sessionFromToken.user as unknown as AuthSession["user"],
      };
    }
  }

  try {
    const { auth } = await import("@/lib/auth-config");
    const betterAuthSession = await auth.api.getSession({
      headers: requestHeaders,
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
    log.debug("[auth-context-factory] Better Auth nao encontrou sessao", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return null;
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

    const userWithPersonal = await db.user.findUnique({
      where: { id: user.id },
      include: { personal: { select: { id: true } } },
    });

    const personalId =
      (user.personal as { id: string } | null | undefined)?.id ||
      (userWithPersonal?.personal as { id: string } | null)?.id ||
      (
        await db.personal.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })
      )?.id;

    if (!personalId) {
      return {
        errorResponse: NextResponse.json(
          { error: "Perfil de personal nao encontrado" },
          { status: 403 },
        ),
      };
    }

    return {
      ctx: { personalId, session, user },
    };
  }

  if (options.type === "gym") {
    const existingGym = await db.gym.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });
    const gymId = user.activeGymId || user.gyms?.[0]?.id || existingGym?.id;

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

  const student =
    user.student ??
    (await db.student.findUnique({ where: { userId: user.id } }));

  if (!student) {
    return { error: "Perfil de aluno nao encontrado." };
  }

  return {
    ctx: {
      studentId: String(student.id),
      session,
      user,
      student,
    },
  };
}

export async function getUserContext(): Promise<UserOnlyContextResult> {
  const auth = await getAuthSession();
  if (!auth) {
    return { error: "Nao autenticado." };
  }

  return { ctx: { user: auth.user, session: auth.session } };
}
