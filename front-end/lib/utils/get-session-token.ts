import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

/**
 * Helper para obter o token de sessão de forma unificada
 * Verifica ambos os cookies: auth_token (legacy) e better-auth.session_token (Better Auth)
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return (
    cookieStore.get("auth_token")?.value ||
    cookieStore.get("better-auth.session_token")?.value ||
    null
  );
}

/**
 * Helper para obter o token de sessão do request (para uso em middleware/API routes)
 */
export function getSessionTokenFromRequest(
  request: NextRequest
): string | null {
  return (
    request.cookies.get("auth_token")?.value ||
    request.cookies.get("better-auth.session_token")?.value ||
    null
  );
}
