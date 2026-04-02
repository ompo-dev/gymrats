import { isPublicRoute } from "@gymrats/domain/middleware-auth";
import type { AuthSessionResponse } from "@/lib/api/auth";
import type { NextRequest } from "next/server";
import type { AppAuthRole } from "../auth/route-access";

type ResolvedAuthSession = {
  session: AuthSessionResponse["session"];
  user: Omit<AuthSessionResponse["user"], "role"> & {
    role: AppAuthRole;
  };
};

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

function buildForwardHeaders(request: Pick<NextRequest, "headers">): Headers {
  const outgoingHeaders = new Headers();
  const cookie = request.headers.get("cookie");
  const authorization = request.headers.get("authorization");
  const userAgent = request.headers.get("user-agent");

  if (cookie) {
    outgoingHeaders.set("cookie", cookie);
  }

  if (authorization) {
    outgoingHeaders.set("authorization", authorization);
  }

  if (userAgent) {
    outgoingHeaders.set("user-agent", userAgent);
  }

  return outgoingHeaders;
}

function toResolvedAuthSession(
  payload: AuthSessionResponse,
): ResolvedAuthSession | null {
  if (!payload?.user?.id) {
    return null;
  }

  return {
    session: payload.session ?? null,
    user: {
      ...payload.user,
      role: normalizeRole(payload.user.role),
    },
  };
}

export { isPublicRoute };

export async function getAuthSession(request: Pick<NextRequest, "headers" | "url">) {
  const sessionUrl = new URL("/api/auth/session", request.url);
  const response = await fetch(sessionUrl, {
    method: "GET",
    headers: buildForwardHeaders(request),
    cache: "no-store",
  }).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as
    | AuthSessionResponse
    | null;

  return payload ? toResolvedAuthSession(payload) : null;
}
