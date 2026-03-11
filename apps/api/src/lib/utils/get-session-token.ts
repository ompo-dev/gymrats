import type { NextRequest } from "@/runtime/next-server";
import {
  getRequestContextCookie,
  getRequestContextHeaders,
} from "../runtime/request-context";

/**
 * Helper para obter o token de sessão de forma unificada
 * Verifica cookies (auth_token, better-auth.session_token) e o header Authorization
 */
export async function getSessionToken(): Promise<string | null> {
  const authHeader = getRequestContextHeaders()?.get("authorization") ?? null;
  const cookieToken =
    getRequestContextCookie("auth_token") ||
    getRequestContextCookie("better-auth.session_token");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  if (cookieToken) return cookieToken;

  return null;
}

/**
 * Helper para obter o token de sessão do request (para uso em middleware/API routes)
 */
export function getSessionTokenFromRequest(
  request: NextRequest,
): string | null {
  const authHeader = request.headers.get("authorization");
  const cookieToken =
    request.cookies.get("auth_token")?.value ||
    request.cookies.get("better-auth.session_token")?.value;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  if (cookieToken) return cookieToken;

  return null;
}
