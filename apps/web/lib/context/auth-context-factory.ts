import type {
  AuthContextPolicy,
  AuthSession,
  GymContext,
  PersonalContext,
  StudentContext,
  UserOnlyContext,
} from "@gymrats/domain/auth-context";
import {
  resolveGymContext,
  resolvePersonalContext,
  resolveStudentContext,
} from "@gymrats/domain/auth-context";
import { extractSessionTokenFromHeaders } from "@gymrats/domain/auth-tokens";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { getSession } from "@/lib/utils/session";

export type {
  AuthSession,
  GymContext,
  PersonalContext,
  StudentContext,
  UserOnlyContext,
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

export type UserOnlyContextResult =
  | { ctx: UserOnlyContext; error?: undefined }
  | { ctx?: undefined; error: string };

const WEB_AUTH_CONTEXT_POLICY = {
  gymLookupWhenMissing: "always",
  studentLookupWhenMissing: "always",
  personalLookupWhenMissing: "always",
  personalMissingStatus: 403,
  personalMissingMessage: "Perfil de personal nao encontrado",
} as const satisfies AuthContextPolicy;

async function getRequestHeaders() {
  const headerList = await headers();
  return new Headers(headerList);
}

async function getSessionToken(): Promise<string | null> {
  const requestHeaders = await getRequestHeaders();
  return extractSessionTokenFromHeaders(requestHeaders);
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

function toErrorResponse(message: string, status = 403) {
  return NextResponse.json({ error: message }, { status });
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
        errorResponse: toErrorResponse("Nao autenticado", 401),
      };
    }

    return { error: "Nao autenticado." };
  }

  if (options.type === "gym") {
    const result = await resolveGymContext(auth, WEB_AUTH_CONTEXT_POLICY);
    if (!result.ok) {
      return {
        errorResponse: toErrorResponse(
          result.error.message,
          result.error.status ?? 403,
        ),
      };
    }
    return { ctx: result.ctx };
  }

  if (options.type === "personal") {
    const result = await resolvePersonalContext(auth, WEB_AUTH_CONTEXT_POLICY);
    if (!result.ok) {
      return {
        errorResponse: toErrorResponse(
          result.error.message,
          result.error.status ?? 403,
        ),
      };
    }
    return { ctx: result.ctx };
  }

  const result = await resolveStudentContext(auth, WEB_AUTH_CONTEXT_POLICY);
  if (!result.ok) {
    return { error: result.error.message };
  }

  return { ctx: result.ctx };
}

export async function getUserContext(): Promise<UserOnlyContextResult> {
  const auth = await getAuthSession();
  if (!auth) {
    return { error: "Nao autenticado." };
  }

  return { ctx: { user: auth.user, session: auth.session } };
}
