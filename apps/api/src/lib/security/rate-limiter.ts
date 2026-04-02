import { randomUUID } from "node:crypto";
import { Elysia } from "elysia";
import { redisConnection } from "@gymrats/cache";
import { log } from "@/lib/observability";
import type { NextRequest } from "@/runtime/next-server";
import { auditLog } from "./audit-log";
import { getRequestIp } from "./request-meta";

const RATE_LIMITS = {
  "auth:sign-in": { limit: 5, windowSeconds: 60 },
  "auth:sign-up": { limit: 3, windowSeconds: 3600 },
  "auth:forgot-password": { limit: 3, windowSeconds: 3600 },
  "auth:verify-reset-code": { limit: 5, windowSeconds: 300 },
  "api:ai-generate": { limit: 10, windowSeconds: 3600 },
  "api:payments": { limit: 5, windowSeconds: 60 },
  "api:general": { limit: 100, windowSeconds: 60 },
} as const;

type RateLimitPolicyName = keyof typeof RATE_LIMITS;

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
};

function resolveRateLimitPolicy(pathname: string): RateLimitPolicyName {
  if (pathname === "/api/auth/sign-in") {
    return "auth:sign-in";
  }

  if (pathname === "/api/auth/sign-up") {
    return "auth:sign-up";
  }

  if (pathname === "/api/auth/forgot-password") {
    return "auth:forgot-password";
  }

  if (pathname === "/api/auth/verify-reset-code") {
    return "auth:verify-reset-code";
  }

  if (
    pathname.includes("/payments") ||
    pathname.endsWith("/subscriptions/create") ||
    pathname.endsWith("/subscription")
  ) {
    return "api:payments";
  }

  if (
    pathname.includes("/chat") ||
    pathname.includes("/chat-stream") ||
    pathname.endsWith("/generate")
  ) {
    return "api:ai-generate";
  }

  return "api:general";
}

async function ensureRedisConnection() {
  if (redisConnection.status === "wait") {
    await redisConnection.connect();
  }
}

function buildRateLimitHeaders(result: RateLimitResult) {
  return {
    "Retry-After": String(result.resetAt),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
  };
}

async function consumeRateLimitBucket(
  key: string,
  policyName: RateLimitPolicyName,
): Promise<RateLimitResult> {
  await ensureRedisConnection();

  const { limit, windowSeconds } = RATE_LIMITS[policyName];
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const redisKey = `rate:${policyName}:${key}`;

  const pipeline = redisConnection.multi();
  pipeline.zremrangebyscore(redisKey, "-inf", windowStart);
  pipeline.zadd(redisKey, now, `${now}-${randomUUID()}`);
  pipeline.zcard(redisKey);
  pipeline.expire(redisKey, windowSeconds);

  const results = await pipeline.exec();
  const currentCount = Number(results?.[2]?.[1] ?? 0);
  const remaining = Math.max(0, limit - currentCount);
  const resetAt = Math.ceil((now + windowSeconds * 1000) / 1000);

  return {
    allowed: currentCount <= limit,
    remaining,
    resetAt,
    limit,
  };
}

async function createRateLimitedResponse(input: {
  request: Pick<NextRequest, "headers" | "url"> | Request;
  actorId?: string | null;
  policyName: RateLimitPolicyName;
  result: RateLimitResult;
}) {
  await auditLog({
    action: "SECURITY:RATE_LIMITED",
    actorId: input.actorId ?? null,
    request:
      input.request instanceof Request ? input.request.headers : input.request,
    payload: {
      policy: input.policyName,
      path: new URL(input.request.url).pathname,
      limit: input.result.limit,
      remaining: input.result.remaining,
      resetAt: input.result.resetAt,
    },
    result: "FAILURE",
  });

  return new Response("Too Many Requests", {
    status: 429,
    headers: buildRateLimitHeaders(input.result),
  });
}

export async function enforceIpRateLimit(
  request: Pick<NextRequest, "headers" | "url"> | Request,
) {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/health" || pathname === "/healthz") {
    return null;
  }

  const policyName = resolveRateLimitPolicy(pathname);
  const ip = getRequestIp(request instanceof Request ? request.headers : request);

  try {
    const result = await consumeRateLimitBucket(`ip:${ip}`, policyName);
    if (result.allowed) {
      return null;
    }

    return createRateLimitedResponse({
      request,
      policyName,
      result,
    });
  } catch (error) {
    log.warn("Rate limit check skipped", {
      path: pathname,
      error: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

export async function enforceSubjectRateLimit(input: {
  request: Pick<NextRequest, "headers" | "url"> | Request;
  subjectKey: string;
  actorId?: string | null;
}) {
  const pathname = new URL(input.request.url).pathname;
  const policyName = resolveRateLimitPolicy(pathname);

  if (policyName !== "api:payments" && policyName !== "api:ai-generate") {
    return null;
  }

  try {
    const result = await consumeRateLimitBucket(
      `subject:${input.subjectKey}`,
      policyName,
    );

    if (result.allowed) {
      return null;
    }

    return createRateLimitedResponse({
      request: input.request,
      actorId: input.actorId,
      policyName,
      result,
    });
  } catch (error) {
    log.warn("Subject rate limit check skipped", {
      path: pathname,
      error: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

export const rateLimitPlugin = new Elysia({ name: "rate-limit" }).onBeforeHandle(
  async ({ request }) => {
    return enforceIpRateLimit(request);
  },
);
