import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { persistTelemetryEvent } from "@/lib/observability";

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

export const POST = createSafeHandler(
  async ({ body }) => {
    await persistTelemetryEvent({
      eventType: body.eventType,
      domain: body.domain,
      journey: body.journey,
      metricName: body.metricName,
      metricValue: body.metricValue,
      status: body.status,
      releaseId: body.releaseId,
      featureFlagSet: body.featureFlagSet,
      payload: body.payload,
    });

    return NextResponse.json({ ok: true }, { status: 202 });
  },
  {
    auth: "none",
    schema: { body: telemetryEventSchema },
  },
);
