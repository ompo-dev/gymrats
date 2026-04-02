export const SESSION_COOKIE_NAMES = [
  "auth_token",
  "__Secure-auth_token",
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
] as const;

export function extractCookieValue(
  headers: Headers,
  name: string,
): string | null {
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

export function extractBearerToken(headers: Headers): string | null {
  const authHeaderValue = headers.get("authorization");
  if (!authHeaderValue) {
    return null;
  }

  const token = authHeaderValue.replace(/^Bearer\s+/i, "").trim();
  return token || null;
}

export function extractSessionTokenFromHeaders(
  headers: Headers,
): string | null {
  return (
    extractBearerToken(headers) ||
    SESSION_COOKIE_NAMES.map((cookieName) =>
      extractCookieValue(headers, cookieName),
    ).find((token): token is string => Boolean(token)) ||
    null
  );
}
