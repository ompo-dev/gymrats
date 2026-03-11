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
  const cookieToken =
    getRequestContextCookie("auth_token") ||
    getRequestContextCookie("better-auth.session_token");
  const authHeader = getRequestContextHeaders()?.get("authorization") ?? null;

  if (cookieToken) return cookieToken;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  return null;
}

/**
 * Helper para obter o token de sessão do request (para uso em middleware/API routes)
 */
export function getSessionTokenFromRequest(
  request: NextRequest,
): string | null {
  const cookieToken =
    request.cookies.get("auth_token")?.value ||
    request.cookies.get("better-auth.session_token")?.value;

  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  return null;
}
