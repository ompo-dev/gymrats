import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { subscribeToObservabilityLiveEvents } from "@/lib/observability/live-events";
import { NextResponse } from "@/runtime/next-server";

const STREAM_PING_INTERVAL_MS = 15_000;

export const GET = createSafeHandler(
  async ({ req }) => {
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const sendEvent = (data: unknown) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        };

        sendEvent({
          kind: "system",
          eventType: "stream.connected",
          domain: "observability",
          occurredAt: new Date().toISOString(),
        });

        const unsubscribe = await subscribeToObservabilityLiveEvents(sendEvent);
        const keepAlive = setInterval(() => {
          controller.enqueue(encoder.encode(": ping\n\n"));
        }, STREAM_PING_INTERVAL_MS);

        const cleanup = async () => {
          clearInterval(keepAlive);
          await unsubscribe();
          try {
            controller.close();
          } catch {
            // Ignore duplicate close on aborted requests.
          }
        };

        if (req.signal.aborted) {
          await cleanup();
          return;
        }

        req.signal.addEventListener(
          "abort",
          () => {
            void cleanup();
          },
          { once: true },
        );
      },
    });

    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  },
  {
    auth: "admin",
  },
);
