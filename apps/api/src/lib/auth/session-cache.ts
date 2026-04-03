import { createHash } from "node:crypto";
import {
  extractBearerToken,
  extractCookieValue,
  SESSION_COOKIE_NAMES,
} from "@gymrats/domain/auth-tokens";
import { db } from "@/lib/db";
import { recordCacheOperation } from "@/lib/runtime/request-context";
import { deleteCacheKeys, getCachedJson, setCachedJson } from "@/lib/cache/resource-cache";

const AUTH_SESSION_CACHE_TTL_SECONDS = 30;
const AUTH_SESSION_CACHE_TTL_MS = AUTH_SESSION_CACHE_TTL_SECONDS * 1000;
const AUTH_SESSION_CACHE_PREFIX = "auth:session:v1:";

type CachedAuthSessionResolution = {
  ok: boolean;
  data?: unknown;
  error?: unknown;
};

const localAuthSessionCache = new Map<
  string,
  {
    expiresAt: number;
    value: CachedAuthSessionResolution;
  }
>();

function normalizeToken(token: string | null | undefined) {
  const normalized = token?.trim();
  return normalized ? normalized : null;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildAuthSessionCacheKey(token: string) {
  return `${AUTH_SESSION_CACHE_PREFIX}${hashToken(token)}`;
}

function maskCacheKey(cacheKey: string) {
  return cacheKey.split(":").slice(0, 3).join(":");
}

function dedupeTokens(tokens: ReadonlyArray<string | null | undefined>) {
  return Array.from(
    new Set(
      tokens
        .map((token) => normalizeToken(token))
        .filter((token): token is string => Boolean(token)),
    ),
  );
}

function getLocalCachedResolution(token: string) {
  const cacheKey = buildAuthSessionCacheKey(token);
  const startedAt = performance.now();
  const cached = localAuthSessionCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    recordCacheOperation({
      operation: "get",
      key: maskCacheKey(cacheKey),
      hit: true,
      durationMs: performance.now() - startedAt,
    });
    return cached.value;
  }

  if (cached) {
    localAuthSessionCache.delete(cacheKey);
  }

  recordCacheOperation({
    operation: "get",
    key: maskCacheKey(cacheKey),
    hit: false,
    durationMs: performance.now() - startedAt,
  });

  return null;
}

function setLocalCachedResolution(
  token: string,
  value: CachedAuthSessionResolution,
  ttlMs = AUTH_SESSION_CACHE_TTL_MS,
) {
  localAuthSessionCache.set(buildAuthSessionCacheKey(token), {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

async function getRemoteCachedResolution(token: string) {
  return getCachedJson<CachedAuthSessionResolution>(buildAuthSessionCacheKey(token));
}

async function setRemoteCachedResolution(
  token: string,
  value: CachedAuthSessionResolution,
) {
  await setCachedJson(
    buildAuthSessionCacheKey(token),
    value,
    AUTH_SESSION_CACHE_TTL_SECONDS,
  );
}

export function extractAuthSessionCacheTokens(headers: Headers) {
  return dedupeTokens([
    extractBearerToken(headers),
    ...SESSION_COOKIE_NAMES.map((cookieName) =>
      extractCookieValue(headers, cookieName),
    ),
  ]);
}

export async function getCachedAuthSessionResolution(
  tokens: ReadonlyArray<string | null | undefined>,
) {
  for (const token of dedupeTokens(tokens)) {
    const localCached = getLocalCachedResolution(token);
    if (localCached) {
      return localCached;
    }

    const remoteCached = await getRemoteCachedResolution(token);
    if (remoteCached) {
      setLocalCachedResolution(token, remoteCached);
      return remoteCached;
    }
  }

  return null;
}

export async function cacheAuthSessionResolution(
  tokens: ReadonlyArray<string | null | undefined>,
  value: CachedAuthSessionResolution,
) {
  if (!value.ok) {
    return;
  }

  const normalizedTokens = dedupeTokens(tokens);
  if (normalizedTokens.length === 0) {
    return;
  }

  await Promise.all(
    normalizedTokens.map(async (token) => {
      setLocalCachedResolution(token, value);
      await setRemoteCachedResolution(token, value);
    }),
  );
}

export async function invalidateAuthSessionCache(
  tokens: ReadonlyArray<string | null | undefined>,
) {
  const normalizedTokens = dedupeTokens(tokens);
  if (normalizedTokens.length === 0) {
    return;
  }

  const cacheKeys = normalizedTokens.map((token) => buildAuthSessionCacheKey(token));
  for (const cacheKey of cacheKeys) {
    localAuthSessionCache.delete(cacheKey);
  }

  await deleteCacheKeys(cacheKeys);
}

export async function invalidateAuthSessionCacheForUser(userId: string) {
  const sessions = await db.session.findMany({
    where: { userId },
    select: {
      token: true,
      sessionToken: true,
    },
  });

  await invalidateAuthSessionCache(
    sessions.flatMap((session) => [session.token, session.sessionToken]),
  );
}
