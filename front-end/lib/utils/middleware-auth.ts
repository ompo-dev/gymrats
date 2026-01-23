import { NextRequest, NextResponse } from "next/server";
import { getSessionTokenFromRequest } from "./get-session-token";

export async function getAuthSession(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const sessionToken =
    authHeader?.replace("Bearer ", "") || getSessionTokenFromRequest(request);

  if (!sessionToken) {
    return null;
  }

  return { token: sessionToken };
}

export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = ["/welcome", "/api/auth", "/onboarding", "/auth/login", "/auth/callback"];

  return publicRoutes.some((route) => pathname.startsWith(route));
}
