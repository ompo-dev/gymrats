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
    const dataset = await getObservabilityDataset(query.sinceHours ?? 24);
    return NextResponse.json({
      windowHours: dataset.windowHours,
      webVitals: dataset.webVitals,
      note: dataset.note,
    });
  },
  {
    auth: "admin",
    schema: { query: querySchema },
  },
);
