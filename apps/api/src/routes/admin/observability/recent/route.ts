import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { getObservabilityDataset } from "@/lib/observability/admin-observability";

const querySchema = z.object({
  sinceHours: z.coerce.number().int().positive().max(24 * 30).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  cursor: z.string().optional(),
});

export const GET = createSafeHandler(
  async ({ query }) => {
    const dataset = await getObservabilityDataset(query.sinceHours ?? 24);
    const cursor = query.cursor ? new Date(query.cursor) : null;
    const filtered = cursor
      ? dataset.recentEvents.filter(
          (event) => new Date(event.occurredAt).getTime() < cursor.getTime(),
        )
      : dataset.recentEvents;

    return NextResponse.json({
      windowHours: dataset.windowHours,
      recent: filtered.slice(0, query.limit ?? 50),
      note: dataset.note,
    });
  },
  {
    auth: "admin",
    schema: { query: querySchema },
  },
);
