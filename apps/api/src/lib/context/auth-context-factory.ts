/**
 * Factory unificada para contexto de autenticacao (gym, student e personal).
 *
 * Centraliza a resolucao de sessao compartilhando o mesmo hot path usado
 * por requireAuth e /api/auth/session.
 */

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
import { resolveAuthSessionFromHeaders } from "@/lib/auth/session-resolver";
import { log } from "@/lib/observability";
import { NextResponse } from "@/runtime/next-server";
import { getRequestContextHeaders } from "../runtime/request-context";

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

const API_AUTH_CONTEXT_POLICY = {
  gymLookupWhenMissing: "admin-only",
  studentLookupWhenMissing: "admin-only",
  personalLookupWhenMissing: "always",
  personalMissingStatus: 500,
  personalMissingMessage: "Personal ID nao encontrado",
} as const satisfies AuthContextPolicy;

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

function toErrorResponse(message: string, status = 403) {
  return NextResponse.json({ error: message }, { status });
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
        errorResponse: toErrorResponse("Nao autenticado", 401),
      };
    }
    return { error: "Nao autenticado." };
  }

  if (options.type === "gym") {
    const result = await resolveGymContext(auth, API_AUTH_CONTEXT_POLICY);
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
    const result = await resolvePersonalContext(auth, API_AUTH_CONTEXT_POLICY);
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

  const result = await resolveStudentContext(auth, API_AUTH_CONTEXT_POLICY);
  if (!result.ok) {
    return { error: result.error.message };
  }

  return { ctx: result.ctx };
}

export async function getUserContext(): Promise<UserOnlyContextResult> {
  const auth = await getAuthSession();
  if (!auth) return { error: "Nao autenticado." };
  return { ctx: { user: auth.user, session: auth.session } };
}
