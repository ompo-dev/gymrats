import { redisConnection } from "@gymrats/cache";
import { recordCacheOperation } from "@/lib/runtime/request-context";
import { parseJsonSafe } from "@/lib/utils/json";

async function ensureRedisConnection() {
  if (redisConnection.status === "wait") {
    await redisConnection.connect();
  }
}

function maskCacheKey(cacheKey: string) {
  return cacheKey.split(":").slice(0, 4).join(":");
}

export async function getCachedJson<T>(cacheKey: string) {
  const startedAt = performance.now();

  try {
    await ensureRedisConnection();
    const raw = await redisConnection.get(cacheKey);
    recordCacheOperation({
      operation: "get",
      key: maskCacheKey(cacheKey),
      hit: raw !== null,
      durationMs: performance.now() - startedAt,
    });
    if (!raw) {
      return null;
    }

    return parseJsonSafe<T>(raw);
  } catch {
    recordCacheOperation({
      operation: "get",
      key: maskCacheKey(cacheKey),
      hit: false,
      durationMs: performance.now() - startedAt,
    });
    return null;
  }
}

export async function setCachedJson<T>(
  cacheKey: string,
  payload: T,
  ttlSeconds: number,
) {
  const startedAt = performance.now();

  try {
    await ensureRedisConnection();
    await redisConnection.set(
      cacheKey,
      JSON.stringify(payload),
      "EX",
      ttlSeconds,
    );
    recordCacheOperation({
      operation: "set",
      key: maskCacheKey(cacheKey),
      durationMs: performance.now() - startedAt,
    });
  } catch {
    recordCacheOperation({
      operation: "set",
      key: maskCacheKey(cacheKey),
      durationMs: performance.now() - startedAt,
    });
    // Cache failures should never break the request path.
  }
}

export async function deleteCacheKeys(
  cacheKeys: Array<string | null | undefined>,
) {
  const filteredKeys = cacheKeys.filter(
    (cacheKey): cacheKey is string =>
      typeof cacheKey === "string" && cacheKey.length > 0,
  );

  if (filteredKeys.length === 0) {
    return;
  }

  const startedAt = performance.now();

  try {
    await ensureRedisConnection();
    await redisConnection.del(...filteredKeys);
    recordCacheOperation({
      operation: "del",
      key: maskCacheKey(filteredKeys[0] ?? "unknown"),
      durationMs: performance.now() - startedAt,
    });
  } catch {
    recordCacheOperation({
      operation: "del",
      key: maskCacheKey(filteredKeys[0] ?? "unknown"),
      durationMs: performance.now() - startedAt,
    });
    // Ignore invalidation failures.
  }
}

export async function deleteCacheKeysByPrefix(prefix: string) {
  if (!prefix) {
    return;
  }

  const startedAt = performance.now();

  try {
    await ensureRedisConnection();

    let cursor = "0";
    do {
      const [nextCursor, keys] = await redisConnection.scan(
        cursor,
        "MATCH",
        `${prefix}*`,
        "COUNT",
        100,
      );

      cursor = nextCursor;

      if (keys.length > 0) {
        await redisConnection.del(...keys);
      }
    } while (cursor !== "0");
    recordCacheOperation({
      operation: "scan",
      key: maskCacheKey(prefix),
      durationMs: performance.now() - startedAt,
    });
  } catch {
    recordCacheOperation({
      operation: "scan",
      key: maskCacheKey(prefix),
      durationMs: performance.now() - startedAt,
    });
    // Ignore invalidation failures.
  }
}
