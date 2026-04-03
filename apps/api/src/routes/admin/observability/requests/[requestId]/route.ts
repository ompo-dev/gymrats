import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { getRequestTrace } from "@/lib/observability/admin-observability";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  requestId: z.string().min(1),
});

export const GET = createSafeHandler(
  async ({ params }) => {
    const trace = await getRequestTrace(String(params?.requestId ?? ""));

    if (!trace) {
      return NextResponse.json(
        { error: "Trace da request nao encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(trace);
  },
  {
    auth: "admin",
    schema: { params: paramsSchema },
  },
);
