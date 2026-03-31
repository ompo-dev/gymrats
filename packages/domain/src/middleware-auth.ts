import { extractSessionTokenFromHeaders } from "./auth-tokens";

export async function getAuthSessionFromHeaders<TSession>(
  headers: Headers,
  deps: {
    getSession: (sessionToken: string) => Promise<TSession | null>;
  },
): Promise<TSession | null> {
  const sessionToken = extractSessionTokenFromHeaders(headers);

  if (!sessionToken) {
    return null;
  }

  try {
    return await deps.getSession(sessionToken);
  } catch {
    return null;
  }
}

export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    "/welcome",
    "/api/auth",
    "/onboarding",
    "/auth/login",
    "/auth/callback",
  ];

  return publicRoutes.some((route) => pathname.startsWith(route));
}
