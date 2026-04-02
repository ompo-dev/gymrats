import { redisConnection } from "@gymrats/cache";
import { createBootstrapResponse, recordCacheOperation } from "@gymrats/domain";
import { parseJsonSafe } from "@/lib/utils/json";
import type { BootstrapSectionTimings } from "@gymrats/types/bootstrap";

type CachedBootstrapPayload<T> = {
  data: T;
  sectionTimings: BootstrapSectionTimings;
};

type CachedBootstrapEnvelope<T> = {
  payload: CachedBootstrapPayload<T>;
  cachedAt: number;
  softTtlMs: number;
  hardTtlMs: number;
};

type CachedBootstrapHit<T> = {
  payload: CachedBootstrapPayload<T>;
  freshness: "fresh" | "stale";
};

const MEMORY_CACHE_LIMIT = 200;
const memoryCache = new Map<string, CachedBootstrapEnvelope<unknown>>();
const inflightBuilds = new Map<
  string,
  Promise<CachedBootstrapPayload<unknown>>
>();
const revalidatingKeys = new Set<string>();

async function ensureRedisConnection() {
  if (
    redisConnection.status === "ready" ||
    redisConnection.status === "connect" ||
    redisConnection.status === "connecting"
  ) {
    return;
  }

  await redisConnection.connect();
}

function getDefaultHardTtlSeconds(softTtlSeconds: number) {
  return Math.max(softTtlSeconds * 10, softTtlSeconds + 120);
}

function setMemoryCacheEntry<T>(
  cacheKey: string,
  envelope: CachedBootstrapEnvelope<T>,
) {
  memoryCache.set(cacheKey, envelope);

  if (memoryCache.size <= MEMORY_CACHE_LIMIT) {
    return;
  }

  const oldestKey = memoryCache.keys().next().value;
  if (oldestKey) {
    memoryCache.delete(oldestKey);
  }
}

function normalizeEnvelope<T>(
  parsed: unknown,
  softTtlMs: number,
  hardTtlMs: number,
): CachedBootstrapEnvelope<T> | null {
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const envelope = parsed as Partial<CachedBootstrapEnvelope<T>> &
    Partial<CachedBootstrapPayload<T>>;

  if (
    envelope.payload &&
    typeof envelope.cachedAt === "number" &&
    typeof envelope.softTtlMs === "number" &&
    typeof envelope.hardTtlMs === "number"
  ) {
    return envelope as CachedBootstrapEnvelope<T>;
  }

  if ("data" in envelope && "sectionTimings" in envelope) {
    return {
      payload: {
        data: envelope.data as T,
        sectionTimings:
          (envelope.sectionTimings as BootstrapSectionTimings) ?? {},
      },
      cachedAt: Date.now(),
      softTtlMs,
      hardTtlMs,
    };
  }

  return null;
}

function resolveFreshness<T>(
  envelope: CachedBootstrapEnvelope<T>,
): CachedBootstrapHit<T> | null {
  const ageMs = Date.now() - envelope.cachedAt;

  if (ageMs > envelope.hardTtlMs) {
    return null;
  }

  return {
    payload: envelope.payload,
    freshness: ageMs <= envelope.softTtlMs ? "fresh" : "stale",
  };
}

async function deleteCacheKey(cacheKey: string) {
  memoryCache.delete(cacheKey);

  try {
    await ensureRedisConnection();
    await redisConnection.del(cacheKey);
  } catch {
    // Melhor esforço.
  }
}

export function buildBootstrapCacheKey(options: {
  domain: "student" | "gym" | "personal";
  actorId: string;
  sections: readonly string[];
  secondaryId?: string;
}) {
  const sortedSections = [...options.sections].sort().join(",");
  return [
    "bootstrap",
    options.domain,
    options.actorId,
    options.secondaryId ?? "",
    sortedSections,
  ].join(":");
}

export async function getCachedBootstrap<T>(
  cacheKey: string,
  softTtlSeconds: number,
  hardTtlSeconds = getDefaultHardTtlSeconds(softTtlSeconds),
) {
  const softTtlMs = softTtlSeconds * 1000;
  const hardTtlMs = hardTtlSeconds * 1000;
  const startedAt = Date.now();

  const memoryEntry = memoryCache.get(cacheKey);
  if (memoryEntry) {
    const memoryHit = resolveFreshness(memoryEntry as CachedBootstrapEnvelope<T>);
    if (memoryHit) {
      recordCacheOperation({
        operation: "get",
        key: cacheKey,
        hit: true,
        durationMs: Date.now() - startedAt,
      });
      return memoryHit;
    }

    memoryCache.delete(cacheKey);
  }

  try {
    await ensureRedisConnection();
    const raw = await redisConnection.get(cacheKey);
    if (!raw) {
      recordCacheOperation({
        operation: "get",
        key: cacheKey,
        hit: false,
        durationMs: Date.now() - startedAt,
      });
      return null;
    }

    const parsed = parseJsonSafe<unknown>(raw);
    const envelope = normalizeEnvelope<T>(parsed, softTtlMs, hardTtlMs);
    if (!envelope) {
      await deleteCacheKey(cacheKey);
      recordCacheOperation({
        operation: "get",
        key: cacheKey,
        hit: false,
        durationMs: Date.now() - startedAt,
      });
      return null;
    }

    const hit = resolveFreshness(envelope);
    if (!hit) {
      await deleteCacheKey(cacheKey);
      recordCacheOperation({
        operation: "get",
        key: cacheKey,
        hit: false,
        durationMs: Date.now() - startedAt,
      });
      return null;
    }

    setMemoryCacheEntry(cacheKey, envelope);
    recordCacheOperation({
      operation: "get",
      key: cacheKey,
      hit: true,
      durationMs: Date.now() - startedAt,
    });
    return hit;
  } catch {
    recordCacheOperation({
      operation: "get",
      key: cacheKey,
      hit: false,
      durationMs: Date.now() - startedAt,
    });
    return null;
  }
}

export async function setCachedBootstrap<T>(
  cacheKey: string,
  payload: CachedBootstrapPayload<T>,
  softTtlSeconds: number,
  hardTtlSeconds = getDefaultHardTtlSeconds(softTtlSeconds),
) {
  const envelope: CachedBootstrapEnvelope<T> = {
    payload,
    cachedAt: Date.now(),
    softTtlMs: softTtlSeconds * 1000,
    hardTtlMs: hardTtlSeconds * 1000,
  };
  const startedAt = Date.now();

  setMemoryCacheEntry(cacheKey, envelope);

  try {
    await ensureRedisConnection();
    await redisConnection.set(
      cacheKey,
      JSON.stringify(envelope),
      "EX",
      hardTtlSeconds,
    );
    recordCacheOperation({
      operation: "set",
      key: cacheKey,
      durationMs: Date.now() - startedAt,
    });
  } catch {
    // Cache deve falhar em silencio.
  }
}

export async function getOrCreateBootstrapPayload<T>(
  cacheKey: string,
  loader: () => Promise<CachedBootstrapPayload<T>>,
) {
  const inflight = inflightBuilds.get(cacheKey);
  if (inflight) {
    return inflight as Promise<CachedBootstrapPayload<T>>;
  }

  const buildPromise = loader().finally(() => {
    inflightBuilds.delete(cacheKey);
  });

  inflightBuilds.set(
    cacheKey,
    buildPromise as Promise<CachedBootstrapPayload<unknown>>,
  );

  return buildPromise;
}

export function revalidateBootstrapInBackground<T>(
  cacheKey: string,
  options: {
    softTtlSeconds: number;
    hardTtlSeconds?: number;
    loader: () => Promise<CachedBootstrapPayload<T>>;
  },
) {
  if (revalidatingKeys.has(cacheKey)) {
    return;
  }

  revalidatingKeys.add(cacheKey);

  void getOrCreateBootstrapPayload(cacheKey, async () => {
    const payload = await options.loader();
    await setCachedBootstrap(
      cacheKey,
      payload,
      options.softTtlSeconds,
      options.hardTtlSeconds,
    );
    return payload;
  })
    .catch(() => {
      // Revalidação é best effort.
    })
    .finally(() => {
      revalidatingKeys.delete(cacheKey);
    });
}

export function createCachedBootstrapResponse<T>(options: {
  data: T;
  sectionTimings: BootstrapSectionTimings;
  strategy: string;
  ttlMs: number;
  hit: boolean;
}) {
  return createBootstrapResponse({
    data: options.data,
    sectionTimings: options.sectionTimings,
    cache: {
      hit: options.hit,
      strategy: options.strategy,
      ttlMs: options.ttlMs,
    },
  });
}
