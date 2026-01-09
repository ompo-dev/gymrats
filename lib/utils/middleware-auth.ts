import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./session";

export async function getAuthSession(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  let sessionToken: string | null = null;

  if (authHeader) {
    sessionToken = authHeader.replace("Bearer ", "");
  } else {
    // Verificar ambos os cookies: auth_token (legacy) e better-auth.session_token (Better Auth)
    sessionToken =
      request.cookies.get("auth_token")?.value ||
      request.cookies.get("better-auth.session_token")?.value ||
      null;
  }

  if (!sessionToken) {
    return null;
  }

  try {
    const session = await getSession(sessionToken);
    return session;
  } catch {
    return null;
  }
}

export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = ["/welcome", "/api/auth", "/onboarding", "/auth/login", "/auth/callback"];

  return publicRoutes.some((route) => pathname.startsWith(route));
}
