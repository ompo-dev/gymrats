import { randomUUID } from "node:crypto";
import { redisConnection } from "@gymrats/cache";
import { parseJsonSafe } from "@/lib/utils/json";

const OBSERVABILITY_EVENTS_CHANNEL = "observability:events";

export type ObservabilityLiveEvent = {
  streamId: string;
  kind: "telemetry" | "business" | "system";
  eventType: string;
  domain: string;
  status?: string | null;
  requestId?: string | null;
  occurredAt: string;
  payload?: Record<string, unknown> | null;
};

async function ensureRedisConnection(client: typeof redisConnection) {
  if (client.status === "wait") {
    await client.connect();
  }
}

export async function publishObservabilityLiveEvent(
  input: Omit<ObservabilityLiveEvent, "streamId"> & { streamId?: string },
) {
  try {
    await ensureRedisConnection(redisConnection);
    await redisConnection.publish(
      OBSERVABILITY_EVENTS_CHANNEL,
      JSON.stringify({
        ...input,
        streamId: input.streamId ?? randomUUID(),
      } satisfies ObservabilityLiveEvent),
    );
  } catch {
    // Realtime fan-out should never break the request path.
  }
}

export async function subscribeToObservabilityLiveEvents(
  onEvent: (event: ObservabilityLiveEvent) => void,
) {
  const subscriber = redisConnection.duplicate();
  await ensureRedisConnection(subscriber);

  const handleMessage = (channel: string, message: string) => {
    if (channel !== OBSERVABILITY_EVENTS_CHANNEL) {
      return;
    }

    try {
      const event = parseJsonSafe<ObservabilityLiveEvent>(message);
      if (event) {
        onEvent(event);
      }
    } catch {
      // Ignore malformed events.
    }
  };

  subscriber.on("message", handleMessage);
  await subscriber.subscribe(OBSERVABILITY_EVENTS_CHANNEL);

  return async () => {
    subscriber.off("message", handleMessage);
    try {
      await subscriber.unsubscribe(OBSERVABILITY_EVENTS_CHANNEL);
    } finally {
      subscriber.disconnect();
    }
  };
}
