const AUTH_TOKEN_KEY = "auth_token";
let authTokenSyncPromise: Promise<string | null> | null = null;

function normalizeBaseUrl(url: string | undefined): string {
  if (!url) return "";
  return url.replace(/\/$/, "");
}

function resolveRuntimePublicApiUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const runtimeWindow = window as Window & {
    __GYMRATS_API_URL__?: string;
  };
  const windowUrl = normalizeBaseUrl(runtimeWindow.__GYMRATS_API_URL__);

  if (windowUrl) {
    return windowUrl;
  }

  const datasetUrl = normalizeBaseUrl(
    document.body?.dataset.apiBaseUrl ||
      document.documentElement?.dataset.apiBaseUrl ||
      undefined,
  );

  if (datasetUrl) {
    return datasetUrl;
  }

  const metaUrl = normalizeBaseUrl(
    document
      .querySelector('meta[name="gymrats-api-base-url"]')
      ?.getAttribute("content") || undefined,
  );

  return metaUrl;
}

function resolveSessionEndpointUrl(): string {
  const runtimeUrl = resolveRuntimePublicApiUrl();
  const publicUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  const authUrl = normalizeBaseUrl(process.env.BETTER_AUTH_URL);
  const baseUrl = runtimeUrl || publicUrl || authUrl;

  return baseUrl ? `${baseUrl}/api/auth/session` : "/api/auth/session";
}

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

type SessionResponse = {
  session?: {
    token?: string | null;
  } | null;
};

async function syncAuthToken(forceRefresh: boolean): Promise<string | null> {
  if (typeof window === "undefined") return null;

  if (!forceRefresh) {
    const existingToken = getAuthToken();
    if (existingToken) {
      return existingToken;
    }
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    clearCookieToken();
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
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as SessionResponse;
      const sessionToken = data.session?.token?.trim();

      if (sessionToken) {
        setAuthToken(sessionToken);
        return sessionToken;
      }

      return getAuthToken();
    } catch {
      return null;
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
