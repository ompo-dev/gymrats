import { createHash } from "node:crypto";
import { redisConnection } from "@gymrats/cache";

const DEFAULT_REPLAY_WINDOW_SECONDS = 60 * 60 * 24;

async function ensureRedisConnection() {
  if (redisConnection.status === "wait") {
    await redisConnection.connect();
  }
}

function buildReplayKey(signature: string, rawBody: string) {
  const digest = createHash("sha256")
    .update(`${signature}:${rawBody}`)
    .digest("hex");

  return `webhook:replay:${digest}`;
}

export async function claimWebhookReplayKey(
  signature: string,
  rawBody: string,
  ttlSeconds: number = DEFAULT_REPLAY_WINDOW_SECONDS,
) {
  await ensureRedisConnection();

  const replayKey = buildReplayKey(signature, rawBody);
  const result = await redisConnection.set(
    replayKey,
    "1",
    "EX",
    ttlSeconds,
    "NX",
  );

  return result === "OK";
}
