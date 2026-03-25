import { redisConnection } from "@gymrats/cache";

async function ensureRedisConnection() {
  if (redisConnection.status === "wait") {
    await redisConnection.connect();
  }
}

export async function getCachedJson<T>(cacheKey: string) {
  try {
    await ensureRedisConnection();
    const raw = await redisConnection.get(cacheKey);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCachedJson<T>(
  cacheKey: string,
  payload: T,
  ttlSeconds: number,
) {
  try {
    await ensureRedisConnection();
    await redisConnection.set(
      cacheKey,
      JSON.stringify(payload),
      "EX",
      ttlSeconds,
    );
  } catch {
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

  try {
    await ensureRedisConnection();
    await redisConnection.del(...filteredKeys);
  } catch {
    // Ignore invalidation failures.
  }
}

export async function deleteCacheKeysByPrefix(prefix: string) {
  if (!prefix) {
    return;
  }

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
  } catch {
    // Ignore invalidation failures.
  }
}
