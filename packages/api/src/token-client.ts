import { isSameOriginApiBaseUrl, normalizeApiBaseUrl } from "./base-url";

const AUTH_TOKEN_KEY = "auth_token";
let authTokenSyncPromise: Promise<string | null> | null = null;

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
  const tokenCookie = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  if (!tokenCookie) {
    return null;
  }

  const [, rawValue = ""] = tokenCookie.split("=", 2);
  return rawValue ? decodeURIComponent(rawValue) : null;
}

function resolveRuntimePublicApiUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const runtimeWindow = window as Window & {
    __GYMRATS_API_URL__?: string;
  };
  const windowUrl = normalizeApiBaseUrl(runtimeWindow.__GYMRATS_API_URL__);

  if (windowUrl) {
    return windowUrl;
  }

  const datasetUrl = normalizeApiBaseUrl(
    document.body?.dataset.apiBaseUrl ||
      document.documentElement?.dataset.apiBaseUrl ||
      undefined,
  );

  if (datasetUrl) {
    return datasetUrl;
  }

  const metaUrl = normalizeApiBaseUrl(
    document
      .querySelector('meta[name="gymrats-api-base-url"]')
      ?.getAttribute("content") || undefined,
  );

  return metaUrl;
}

function resolveSessionEndpointUrl(): string {
  const runtimeUrl = resolveRuntimePublicApiUrl();
  const publicUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  const authUrl = normalizeApiBaseUrl(process.env.BETTER_AUTH_URL);
  const baseUrl = runtimeUrl || publicUrl || authUrl;

  if (isSameOriginApiBaseUrl(baseUrl)) {
    return "/api/auth/session";
  }

  return baseUrl ? `${baseUrl}/api/auth/session` : "/api/auth/session";
}

function getCookieToken(): string | null {
  return getCookieValue(AUTH_TOKEN_KEY);
}

function getLocalStorageToken(): string | null {
  if (typeof window === "undefined") return null;

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
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
  const localStorageToken = getLocalStorageToken();

  // No browser, priorizamos localStorage porque ele e' o estado mais estavel
  // para requests client-side. Se houver divergencia, sincronizamos o cookie.
  if (localStorageToken) {
    if (cookieToken !== localStorageToken) {
      setCookieToken(localStorageToken);
    }
    return localStorageToken;
  }

  if (cookieToken) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, cookieToken);
    return cookieToken;
  }

  return null;
}

export function hasBrowserSessionHint(): boolean {
  if (typeof window === "undefined") return false;

  return Boolean(getAuthToken() || getCookieValue("better-auth.session_token"));
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

type SessionResponse = {
  session?: {
    token?: string | null;
  } | null;
};

async function syncAuthToken(forceRefresh: boolean): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const existingToken = getAuthToken();

  if (!forceRefresh && existingToken) {
    return existingToken;
  }

  if (authTokenSyncPromise) {
    return authTokenSyncPromise;
  }

  authTokenSyncPromise = (async () => {
    try {
      const response = await fetch(resolveSessionEndpointUrl(), {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          Accept: "application/json",
          ...(existingToken
            ? { Authorization: `Bearer ${existingToken}` }
            : {}),
        },
      });

      if (!response.ok) {
        return existingToken;
      }

      const data = (await response.json()) as SessionResponse;
      const sessionToken = data.session?.token?.trim();

      if (sessionToken) {
        setAuthToken(sessionToken);
        return sessionToken;
      }

      return existingToken;
    } catch {
      return existingToken;
    } finally {
      authTokenSyncPromise = null;
    }
  })();

  return authTokenSyncPromise;
}

export async function ensureAuthToken(): Promise<string | null> {
  return syncAuthToken(false);
}

export async function refreshAuthToken(): Promise<string | null> {
  return syncAuthToken(true);
}
