import {
  extractBearerToken,
  extractCookieValue,
} from "@gymrats/domain/auth-tokens";
import { isPublicRoute } from "@gymrats/domain/middleware-auth";
import type { GetSessionDeps, GetSessionOutput } from "@/lib/use-cases/auth/use-cases";
import { getSessionUseCase } from "@/lib/use-cases/auth/use-cases";
import { auth } from "@/lib/auth-config";
import { db } from "@/lib/db";
import type { NextRequest } from "next/server";
import type { AppAuthRole } from "../auth/route-access";
import { getSession } from "./session";

const SESSION_USER_INCLUDE = {
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
} as const;

type ResolvedAuthSession = {
  session: GetSessionOutput["session"];
  user: Omit<GetSessionOutput["user"], "role"> & {
    role: AppAuthRole;
  };
};

const defaultGetSessionDeps: GetSessionDeps = {
  getBetterAuthSession: async (requestHeaders) =>
    auth.api.getSession({ headers: requestHeaders }),
  findUserById: (userId) =>
    db.user.findUnique({
      where: { id: userId },
      include: SESSION_USER_INCLUDE,
    }),
  getSessionTokenById: async (sessionId) => {
    const sessionFromDb = await db.session.findUnique({
      where: { id: sessionId },
      select: { token: true, sessionToken: true },
    });

    return sessionFromDb?.token || sessionFromDb?.sessionToken || null;
  },
  getSessionByToken: getSession,
};

function readSessionInput(headers: Headers) {
  return {
    headers,
    authHeaderToken: extractBearerToken(headers),
    cookieAuthToken:
      extractCookieValue(headers, "auth_token") ||
      extractCookieValue(headers, "__Secure-auth_token"),
    cookieBetterAuthToken:
      extractCookieValue(headers, "better-auth.session_token") ||
      extractCookieValue(headers, "__Secure-better-auth.session_token"),
  };
}

function normalizeRole(role: string): AppAuthRole {
  switch (role) {
    case "PENDING":
    case "STUDENT":
    case "GYM":
    case "PERSONAL":
    case "ADMIN":
      return role;
    default:
      return null;
  }
}

export { isPublicRoute };

export async function getAuthSessionFromRequestHeaders(
  headers: Headers,
  deps: GetSessionDeps = defaultGetSessionDeps,
): Promise<ResolvedAuthSession | null> {
  const result = await getSessionUseCase(deps, readSessionInput(headers));

  if (!result.ok) {
    return null;
  }

  return {
    session: result.data.session,
    user: {
      ...result.data.user,
      role: normalizeRole(result.data.user.role),
    },
  };
}

export async function getAuthSession(request: Pick<NextRequest, "headers">) {
  return getAuthSessionFromRequestHeaders(request.headers);
}
