import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import {
  persistTelemetryEvents,
  type TelemetryEventInput,
} from "@/lib/observability";
import { NextResponse } from "@/runtime/next-server";

const telemetryEventSchema = z.object({
  eventType: z.string().min(1),
  domain: z.string().min(1).default("web"),
  journey: z.string().optional(),
  metricName: z.string().optional(),
  metricValue: z.number().optional(),
  status: z.string().optional(),
  releaseId: z.string().optional(),
  featureFlagSet: z.array(z.string()).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

const telemetryEventBatchSchema = z.union([
  telemetryEventSchema,
  z.array(telemetryEventSchema).min(1).max(50),
]);

export const POST = createSafeHandler(
  async ({ body }) => {
    const events = (
      Array.isArray(body) ? body : [body]
    ) as TelemetryEventInput[];
    await persistTelemetryEvents(
      events.map((event) => ({
        eventType: event.eventType,
        domain: event.domain,
        journey: event.journey,
        metricName: event.metricName,
        metricValue: event.metricValue,
        status: event.status,
        releaseId: event.releaseId,
        featureFlagSet: event.featureFlagSet,
        payload: event.payload,
      })),
    );

    return NextResponse.json(
      { ok: true, accepted: events.length },
      { status: 202 },
    );
  },
  {
    auth: "none",
    schema: { body: telemetryEventBatchSchema },
  },
);
