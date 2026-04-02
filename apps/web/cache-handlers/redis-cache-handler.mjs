import Redis from "ioredis";
import pino from "pino";

const ENTRY_PREFIX = "next:cache:entry:";
const TAGS_KEY = "next:cache:tags";
const pendingWrites = new Map();
const memoryEntries = new Map();
const memoryTags = new Map();
let hasWarnedAboutMemoryFallback = false;

const log = pino(
  {
    name: "gymrats-next-cache",
    level:
      process.env.LOG_LEVEL ??
      (process.env.NODE_ENV === "production" ? "info" : "debug"),
    base: process.env.GYMRATS_RUNTIME_ROLE
      ? { runtime: process.env.GYMRATS_RUNTIME_ROLE }
      : undefined,
    messageKey: "message",
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  },
  pino.destination({ sync: false, minLength: 4096 }),
);

function requiresManagedRedis() {
  const runtimeRole = process.env.GYMRATS_RUNTIME_ROLE;

  return (
    runtimeRole === "api" ||
    runtimeRole === "worker" ||
    runtimeRole === "cron" ||
    Boolean(process.env.RAILWAY_ENVIRONMENT_NAME)
  );
}

function resolveRedisUrl() {
  return (
    process.env.REDIS_URL ||
    process.env.UPSTASH_REDIS_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    null
  );
}

const redisUrl = resolveRedisUrl();
const redis = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    })
  : null;

if (redis) {
  redis.on("error", (error) => {
    log.error({ error }, "Next Redis cache connection failed");
  });
} else if (
  (process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PRIVATE_DEBUG_CACHE === "1") &&
  !requiresManagedRedis() &&
  !hasWarnedAboutMemoryFallback
) {
  hasWarnedAboutMemoryFallback = true;
  log.warn(
    "REDIS_URL ausente. Usando fallback em memoria no cache handler do Next.",
  );
}

async function ensureConnection() {
  if (!redis) {
    return;
  }

  if (redis.status === "wait") {
    await redis.connect();
  }
}

async function streamToBase64(stream) {
  const response = new Response(stream);
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString("base64");
}

function base64ToStream(base64Value) {
  const buffer = Buffer.from(base64Value, "base64");
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buffer));
      controller.close();
    },
  });
}

async function waitForPendingWrite(cacheKey) {
  const pendingWrite = pendingWrites.get(cacheKey);

  if (pendingWrite) {
    await pendingWrite;
  }
}

export default class RedisCacheHandler {
  constructor() {}

  async get(cacheKey, softTags) {
    await waitForPendingWrite(cacheKey);
    await ensureConnection();

    const raw = redis
      ? await redis.get(`${ENTRY_PREFIX}${cacheKey}`)
      : memoryEntries.get(cacheKey);

    if (!raw) {
      return undefined;
    }

    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const expiration = await this.getExpiration(softTags);

    if (expiration > parsed.timestamp) {
      return undefined;
    }

    const expiresAt =
      typeof parsed.expire === "number"
        ? parsed.timestamp + parsed.expire * 1000
        : Number.POSITIVE_INFINITY;

    if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
      if (redis) {
        await redis.del(`${ENTRY_PREFIX}${cacheKey}`);
      } else {
        memoryEntries.delete(cacheKey);
      }
      return undefined;
    }

    return {
      ...parsed,
      value: base64ToStream(parsed.value),
    };
  }

  async set(cacheKey, pendingEntry) {
    const writePromise = (async () => {
      await ensureConnection();

      const entry = await pendingEntry;
      const [persistedStream] = entry.value.tee();
      const serialized = {
        ...entry,
        value: await streamToBase64(persistedStream),
      };

      if (redis) {
        await redis.set(`${ENTRY_PREFIX}${cacheKey}`, JSON.stringify(serialized));
      } else {
        memoryEntries.set(cacheKey, serialized);
      }
    })();

    pendingWrites.set(cacheKey, writePromise);

    try {
      await writePromise;
    } finally {
      pendingWrites.delete(cacheKey);
    }
  }

  async refreshTags() {}

  async getExpiration(tags) {
    if (!tags.length) {
      return 0;
    }

    await ensureConnection();
    const timestamps = redis
      ? await redis.hmget(TAGS_KEY, ...tags)
      : tags.map((tag) => memoryTags.get(tag) ?? null);

    return timestamps.reduce((latestTimestamp, currentValue) => {
      const numericValue = currentValue ? Number(currentValue) : 0;
      return Number.isFinite(numericValue)
        ? Math.max(latestTimestamp, numericValue)
        : latestTimestamp;
    }, 0);
  }

  async updateTags(tags) {
    if (!tags.length) {
      return;
    }

    await ensureConnection();
    const now = Date.now();
    const values = [];

    for (const tag of tags) {
      values.push(tag, String(now));
    }

    if (redis) {
      await redis.hset(TAGS_KEY, ...values);
    } else {
      for (const tag of tags) {
        memoryTags.set(tag, now);
      }
    }
  }
}
