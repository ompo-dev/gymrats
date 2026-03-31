import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { getObservabilityDataset } from "@/lib/observability/admin-observability";
import { NextResponse } from "@/runtime/next-server";

const querySchema = z.object({
  sinceHours: z.coerce
    .number()
    .int()
    .positive()
    .max(24 * 30)
    .optional(),
});

export const GET = createSafeHandler(
  async ({ query }) => {
    const sinceHours = query.sinceHours ?? 24;
    const dataset = await getObservabilityDataset(sinceHours);

    return NextResponse.json({
      windowHours: dataset.windowHours,
      counts: dataset.counts,
      api: dataset.api,
      domains: dataset.domains,
      recentEvents: dataset.recentEvents.slice(0, 25),
      recentBusinessEvents: dataset.recentBusinessEvents,
      note: dataset.note,
    });
  },
  {
    auth: "admin",
    schema: { query: querySchema },
  },
);
