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
  limit: z.coerce.number().int().positive().max(200).optional(),
  statusClass: z.enum(["2xx", "4xx", "5xx"]).optional(),
});

export const GET = createSafeHandler(
  async ({ query }) => {
    const dataset = await getObservabilityDataset(query.sinceHours ?? 24);
    const filtered = query.statusClass
      ? dataset.requests.filter(
          (request) =>
            `${Math.floor(request.status / 100)}xx` === query.statusClass,
        )
      : dataset.requests;

    return NextResponse.json({
      windowHours: dataset.windowHours,
      requests: filtered.slice(0, query.limit ?? 50),
      note: dataset.note,
    });
  },
  {
    auth: "admin",
    schema: { query: querySchema },
  },
);
