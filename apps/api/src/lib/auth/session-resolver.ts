import type { NextRequest } from "@/runtime/next-server";
import { auth } from "@/lib/auth-config";
import { db } from "@/lib/db";
import { getSessionUseCase } from "@/lib/use-cases/auth";
import { getSession } from "@/lib/utils/session";

const requestCache = new WeakMap<Request, Promise<ResolvedSessionResult>>();
const headersCache = new WeakMap<Headers, Promise<ResolvedSessionResult>>();

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

type ResolvedSessionResult = Awaited<ReturnType<typeof getSessionUseCase>>;

function extractCookieValue(headers: Headers, name: string) {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  for (const chunk of cookieHeader.split(";")) {
    const [rawName, ...rest] = chunk.trim().split("=");
    if (rawName === name) {
      const value = rest.join("=");
      return value ? decodeURIComponent(value) : null;
    }
  }

  return null;
}

function extractBearerToken(headers: Headers) {
  const authHeaderValue = headers.get("authorization");
  return authHeaderValue
    ? authHeaderValue.replace(/^Bearer\s+/i, "").trim()
    : null;
}

function createResolution(headers: Headers): Promise<ResolvedSessionResult> {
  return getSessionUseCase(
    {
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
    },
    {
      headers,
      authHeaderToken: extractBearerToken(headers),
      cookieAuthToken: extractCookieValue(headers, "auth_token"),
      cookieBetterAuthToken: extractCookieValue(
        headers,
        "better-auth.session_token",
      ),
    },
  );
}

export function resolveAuthSessionFromHeaders(headers?: Headers | null) {
  if (!headers) {
    return createResolution(new Headers());
  }

  const cached = headersCache.get(headers);
  if (cached) {
    return cached;
  }

  const resolution = createResolution(headers);
  headersCache.set(headers, resolution);
  return resolution;
}

export function resolveAuthSessionFromRequest(request: NextRequest | Request) {
  const cached = requestCache.get(request);
  if (cached) {
    return cached;
  }

  const resolution = resolveAuthSessionFromHeaders(request.headers);
  requestCache.set(request, resolution);
  return resolution;
}
