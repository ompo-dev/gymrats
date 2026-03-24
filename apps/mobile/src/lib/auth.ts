import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type { AppConfig, AuthSessionPayload } from "../store/types";
import { normalizeUrl } from "../utils/url";

type ApiErrorShape = {
  error?: string;
  message?: string;
};

type TokenExchangeCacheEntry = {
  expiresAt: number;
  promise?: Promise<AuthSessionPayload>;
  result?: AuthSessionPayload;
};

const TOKEN_EXCHANGE_CACHE_TTL_MS = 30_000;
const tokenExchangeCache = new Map<string, TokenExchangeCacheEntry>();

async function parseError(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as ApiErrorShape;
    return json.error || json.message || "Erro inesperado";
  } catch {
    return "Erro inesperado";
  }
}

function cleanupTokenExchangeCache() {
  const now = Date.now();

  for (const [token, entry] of tokenExchangeCache.entries()) {
    if (entry.expiresAt <= now) {
      tokenExchangeCache.delete(token);
    }
  }
}

export function getAuthCallbackUrl() {
  return Linking.createURL("/auth/callback");
}

export function isAuthCallbackUrl(url: string): boolean {
  try {
    const callbackUrl = new URL(getAuthCallbackUrl());
    const parsedUrl = new URL(url);
    const normalizedCallbackPath = callbackUrl.pathname.replace(/\/$/, "");
    const normalizedParsedPath = parsedUrl.pathname.replace(/\/$/, "");

    return (
      normalizedParsedPath === normalizedCallbackPath ||
      normalizedParsedPath.endsWith(normalizedCallbackPath) ||
      normalizedParsedPath.endsWith(`/--${normalizedCallbackPath}`) ||
      normalizedParsedPath.includes("/auth/callback")
    );
  } catch {
    return false;
  }
}

export async function exchangeOneTimeToken(
  apiUrl: string,
  token: string
): Promise<AuthSessionPayload> {
  const normalizedApiUrl = normalizeUrl(apiUrl);
  if (!normalizedApiUrl) {
    throw new Error("A URL da API nao esta configurada.");
  }

  const response = await fetch(
    `${normalizedApiUrl}/api/auth/exchange-one-time-token`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    }
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as AuthSessionPayload;
  if (!payload.session?.token || !payload.user) {
    throw new Error("Sessao invalida retornada pelo backend.");
  }

  return payload;
}

export async function consumeOneTimeToken(
  apiUrl: string,
  token: string
): Promise<AuthSessionPayload> {
  cleanupTokenExchangeCache();

  const cachedEntry = tokenExchangeCache.get(token);
  if (cachedEntry?.result) {
    return cachedEntry.result;
  }

  if (cachedEntry?.promise) {
    return cachedEntry.promise;
  }

  const exchangePromise = exchangeOneTimeToken(apiUrl, token)
    .then((payload) => {
      tokenExchangeCache.set(token, {
        expiresAt: Date.now() + TOKEN_EXCHANGE_CACHE_TTL_MS,
        result: payload
      });

      return payload;
    })
    .catch((error) => {
      tokenExchangeCache.delete(token);
      throw error;
    });

  tokenExchangeCache.set(token, {
    expiresAt: Date.now() + TOKEN_EXCHANGE_CACHE_TTL_MS,
    promise: exchangePromise
  });

  return exchangePromise;
}

export async function refreshAuthSession(
  apiUrl: string,
  token: string
): Promise<AuthSessionPayload> {
  const normalizedApiUrl = normalizeUrl(apiUrl);
  if (!normalizedApiUrl) {
    throw new Error("A URL da API nao esta configurada.");
  }

  const response = await fetch(`${normalizedApiUrl}/api/auth/session`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const payload = (await response.json()) as AuthSessionPayload;
  if (!payload.session?.token || !payload.user) {
    throw new Error("Sessao invalida retornada pelo backend.");
  }

  return payload;
}

export async function startGoogleAuthSession(
  config: AppConfig
): Promise<AuthSessionPayload> {
  const normalizedWebUrl = normalizeUrl(config.webUrl);
  const normalizedApiUrl = normalizeUrl(config.apiUrl);
  const normalizedAuthUrl = normalizedWebUrl || normalizedApiUrl;

  if (!normalizedAuthUrl || !normalizedApiUrl) {
    throw new Error("As URLs do app mobile nao estao configuradas.");
  }

  const redirectUrl = getAuthCallbackUrl();
  const startUrl = new URL("/api/auth/google/start", normalizedAuthUrl);
  startUrl.searchParams.set("redirectTo", redirectUrl);
  startUrl.searchParams.set("errorRedirectTo", `${redirectUrl}?error=true`);

  const result = await WebBrowser.openAuthSessionAsync(
    startUrl.toString(),
    redirectUrl
  );

  if (result.type !== "success" || !result.url) {
    throw new Error("O login foi cancelado ou nao retornou um callback valido.");
  }

  const callbackUrl = new URL(result.url);
  const errorParam = callbackUrl.searchParams.get("error");
  if (errorParam) {
    throw new Error("Erro ao autenticar com Google.");
  }

  const token =
    callbackUrl.searchParams.get("oneTimeToken") ||
    callbackUrl.searchParams.get("token");

  if (!token) {
    throw new Error("O callback de autenticacao nao retornou token.");
  }

  return consumeOneTimeToken(normalizedApiUrl, token);
}
