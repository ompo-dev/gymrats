const AUTH_TOKEN_KEY = "auth_token";

function getCookieToken(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
  const tokenCookie = cookies.find((cookie) =>
    cookie.startsWith(`${AUTH_TOKEN_KEY}=`),
  );

  if (!tokenCookie) {
    return null;
  }

  const [, rawValue = ""] = tokenCookie.split("=", 2);
  return rawValue ? decodeURIComponent(rawValue) : null;
}

function setCookieToken(token: string): void {
  if (typeof document === "undefined") return;

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${secure}`;
}

function clearCookieToken(): void {
  if (typeof document === "undefined") return;

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  document.cookie = `${AUTH_TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const cookieToken = getCookieToken();
  const localStorageToken = window.localStorage.getItem(AUTH_TOKEN_KEY);

  // O cookie e' a fonte mais confiavel porque ele tambem alimenta o SSR.
  // Se os dois divergirem, sincronizamos o localStorage com o valor atual.
  if (cookieToken) {
    if (localStorageToken !== cookieToken) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, cookieToken);
    }
    return cookieToken;
  }

  return localStorageToken;
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  setCookieToken(token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  clearCookieToken();
}
