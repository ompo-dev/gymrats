import Redis from "ioredis";

const ENTRY_PREFIX = "next:cache:entry:";
const TAGS_KEY = "next:cache:tags";
const pendingWrites = new Map();

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
  const url =
    process.env.REDIS_URL ||
    process.env.UPSTASH_REDIS_URL ||
    process.env.UPSTASH_REDIS_REST_URL;

  if (url) {
    return url;
  }

  if (process.env.VERCEL) {
    return "redis://localhost:6379";
  }

  if (process.env.NODE_ENV === "production" && requiresManagedRedis()) {
    throw new Error(
      "REDIS_URL (ou UPSTASH_REDIS_URL) eh obrigatoria em producao.",
    );
  }

  return "redis://localhost:6379";
}

const redis = new Redis(resolveRedisUrl(), {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redis.on("error", (error) => {
  console.error("[Next Redis Cache] Failed:", error);
});

async function ensureConnection() {
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

    const raw = await redis.get(`${ENTRY_PREFIX}${cacheKey}`);
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw);
    const expiration = await this.getExpiration(softTags);

    if (expiration > parsed.timestamp) {
      return undefined;
    }

    const expiresAt =
      typeof parsed.expire === "number"
        ? parsed.timestamp + parsed.expire * 1000
        : Number.POSITIVE_INFINITY;

    if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
      await redis.del(`${ENTRY_PREFIX}${cacheKey}`);
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

      await redis.set(`${ENTRY_PREFIX}${cacheKey}`, JSON.stringify(serialized));
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
    const timestamps = await redis.hmget(TAGS_KEY, ...tags);

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

    await redis.hset(TAGS_KEY, ...values);
  }
}
