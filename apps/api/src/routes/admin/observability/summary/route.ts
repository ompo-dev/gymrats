import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

const querySchema = z.object({
  sinceHours: z.coerce.number().int().positive().max(24 * 30).optional(),
});

function percentile(values: number[], ratio: number) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * ratio) - 1),
  );
  return sorted[index] ?? 0;
}

export const GET = createSafeHandler(
  async ({ query }) => {
    const sinceHours = query.sinceHours ?? 24;
    const occurredAt = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

    try {
      const telemetryEvents = await (db as any).telemetryEvent.findMany({
        where: {
          occurredAt: {
            gte: occurredAt,
          },
        },
        orderBy: {
          occurredAt: "desc",
        },
        take: 2000,
      });

      const businessEvents = await (db as any).businessEvent.findMany({
        where: {
          occurredAt: {
            gte: occurredAt,
          },
        },
        orderBy: {
          occurredAt: "desc",
        },
        take: 500,
      });

      const apiEvents = telemetryEvents.filter(
        (event: { eventType?: string }) => event.eventType === "api.request",
      );
      const frontendEvents = telemetryEvents.filter(
        (event: { domain?: string }) => event.domain === "web",
      );
      const latencies = apiEvents
        .map((event: { metricValue?: number | null; payload?: { latencyMs?: number } }) =>
          typeof event.metricValue === "number"
            ? event.metricValue
            : Number(event.payload?.latencyMs ?? 0),
        )
        .filter((value: number) => Number.isFinite(value) && value > 0);
      const errors = apiEvents.filter(
        (event: { status?: string | null }) =>
          Number(event.status ?? "200") >= 400,
      ).length;
      const domains = Object.values(
        telemetryEvents.reduce<
          Record<
            string,
            { domain: string; total: number; errors: number; apiRequests: number }
          >
        >((acc, event: { domain?: string | null; eventType?: string; status?: string | null }) => {
          const domain = event.domain || "unknown";
          if (!acc[domain]) {
            acc[domain] = {
              domain,
              total: 0,
              errors: 0,
              apiRequests: 0,
            };
          }

          acc[domain].total += 1;
          if (event.eventType === "api.request") {
            acc[domain].apiRequests += 1;
            if (Number(event.status ?? "200") >= 400) {
              acc[domain].errors += 1;
            }
          }

          return acc;
        }, {}),
      ).sort((left, right) => right.total - left.total);

      return NextResponse.json({
        windowHours: sinceHours,
        counts: {
          telemetryEvents: telemetryEvents.length,
          frontendEvents: frontendEvents.length,
          businessEvents: businessEvents.length,
        },
        api: {
          requestCount: apiEvents.length,
          errorCount: errors,
          avgLatencyMs:
            latencies.length > 0
              ? Math.round(
                  latencies.reduce((sum, value) => sum + value, 0) / latencies.length,
                )
              : 0,
          p50LatencyMs: percentile(latencies, 0.5),
          p95LatencyMs: percentile(latencies, 0.95),
        },
        domains,
        recentEvents: telemetryEvents.slice(0, 25),
        recentBusinessEvents: businessEvents.slice(0, 25),
      });
    } catch (error) {
      return NextResponse.json({
        windowHours: sinceHours,
        counts: {
          telemetryEvents: 0,
          frontendEvents: 0,
          businessEvents: 0,
        },
        api: {
          requestCount: 0,
          errorCount: 0,
          avgLatencyMs: 0,
          p50LatencyMs: 0,
          p95LatencyMs: 0,
        },
        domains: [],
        recentEvents: [],
        recentBusinessEvents: [],
        note:
          error instanceof Error
            ? error.message
            : "Telemetry tables are not available yet.",
      });
    }
  },
  {
    auth: "admin",
    schema: { query: querySchema },
  },
);
