import type { BootstrapSectionTimings } from "@gymrats/types/bootstrap";
import { createBootstrapResponse } from "@gymrats/domain";
import { redisConnection } from "@gymrats/cache";

type CachedBootstrapPayload<T> = {
  data: T;
  sectionTimings: BootstrapSectionTimings;
};

async function ensureRedisConnection() {
  if (redisConnection.status === "wait") {
    await redisConnection.connect();
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

export async function getCachedBootstrap<T>(cacheKey: string) {
  try {
    await ensureRedisConnection();
    const raw = await redisConnection.get(cacheKey);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as CachedBootstrapPayload<T>;
  } catch {
    return null;
  }
}

export async function setCachedBootstrap<T>(
  cacheKey: string,
  payload: CachedBootstrapPayload<T>,
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
    // Cache deve falhar em silencio.
  }
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
