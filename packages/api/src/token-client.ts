import { isSameOriginApiBaseUrl, normalizeApiBaseUrl } from "./base-url";

const NATIVE_AUTH_HINT_KEY = "__GYMRATS_NATIVE_AUTH_ACTIVE__";
const NATIVE_AUTH_SET_EVENT = "gymrats-auth-token-set";
const NATIVE_AUTH_CLEAR_EVENT = "gymrats-auth-token-clear";

let authSessionProbePromise: Promise<boolean> | null = null;

type RuntimeWindow = Window & {
  __GYMRATS_API_URL__?: string;
  __GYMRATS_NATIVE_AUTH_ACTIVE__?: boolean;
  ReactNativeWebView?: unknown;
  GymRatsNativeBridge?: unknown;
};

type SessionResponse = {
  session?: {
    id?: string | null;
    token?: string | null;
  } | null;
};

function getRuntimeWindow(): RuntimeWindow | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window as RuntimeWindow;
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
  const tokenCookie = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  if (!tokenCookie) {
    return null;
  }

  const [, rawValue = ""] = tokenCookie.split("=", 2);
  return rawValue ? decodeURIComponent(rawValue) : null;
}

function resolveRuntimePublicApiUrl(): string {
  const runtimeWindow = getRuntimeWindow();
  if (!runtimeWindow) {
    return "";
  }

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

  return normalizeApiBaseUrl(
    document
      .querySelector('meta[name="gymrats-api-base-url"]')
      ?.getAttribute("content") || undefined,
  );
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

function isNativeShell() {
  const runtimeWindow = getRuntimeWindow();
  return Boolean(
    runtimeWindow?.ReactNativeWebView || runtimeWindow?.GymRatsNativeBridge,
  );
}

function updateNativeAuthHint(isActive: boolean) {
  const runtimeWindow = getRuntimeWindow();
  if (!runtimeWindow) {
    return;
  }

  runtimeWindow[NATIVE_AUTH_HINT_KEY] = isActive;
}

function dispatchNativeAuthEvent(
  eventName: string,
  detail?: { token: string },
) {
  const runtimeWindow = getRuntimeWindow();
  if (!runtimeWindow || !isNativeShell()) {
    return;
  }

  try {
    const event =
      typeof CustomEvent === "function"
        ? new CustomEvent(eventName, { detail })
        : (() => {
            const fallbackEvent = document.createEvent("CustomEvent");
            fallbackEvent.initCustomEvent(eventName, true, true, detail);
            return fallbackEvent;
          })();

    runtimeWindow.dispatchEvent(event);
    document.dispatchEvent(event);
  } catch {
    // noop
  }
}

export function getAuthToken(): string | null {
  return null;
}

export function hasBrowserSessionHint(): boolean {
  const runtimeWindow = getRuntimeWindow();
  if (!runtimeWindow) {
    return false;
  }

  return Boolean(
    runtimeWindow[NATIVE_AUTH_HINT_KEY] ||
      getCookieValue("better-auth.session_token"),
  );
}

export function setAuthToken(token: string): void {
  const nextToken = token.trim();
  if (!nextToken) {
    clearAuthToken();
    return;
  }

  updateNativeAuthHint(true);
  dispatchNativeAuthEvent(NATIVE_AUTH_SET_EVENT, { token: nextToken });
}

export function clearAuthToken(): void {
  updateNativeAuthHint(false);
  dispatchNativeAuthEvent(NATIVE_AUTH_CLEAR_EVENT);
}

async function syncAuthSession(forceRefresh: boolean): Promise<boolean> {
  const runtimeWindow = getRuntimeWindow();
  if (!runtimeWindow) {
    return false;
  }

  if (!forceRefresh && hasBrowserSessionHint()) {
    return true;
  }

  if (authSessionProbePromise) {
    return authSessionProbePromise;
  }

  authSessionProbePromise = (async () => {
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
        if (response.status === 401) {
          updateNativeAuthHint(false);
        }
        return false;
      }

      const data = (await response.json()) as SessionResponse;
      const hasSession = Boolean(data.session?.id);

      updateNativeAuthHint(hasSession);
      return hasSession;
    } catch {
      return hasBrowserSessionHint();
    } finally {
      authSessionProbePromise = null;
    }
  })();

  return authSessionProbePromise;
}

export async function ensureAuthToken(): Promise<boolean> {
  return syncAuthSession(false);
}

export async function refreshAuthToken(): Promise<boolean> {
  return syncAuthSession(true);
}
