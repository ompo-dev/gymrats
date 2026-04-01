import {
  accessEventIdParamsSchema,
  accessReconcileEventSchema,
} from "@/lib/api/schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { AccessService } from "@/lib/services/access/access.service";
import { NextResponse } from "@/runtime/next-server";

export const POST = createSafeHandler(
  async ({ gymContext, params, body }) => {
    const { eventId } = accessEventIdParamsSchema.parse(params);
    const event = await AccessService.reconcileEvent(
      gymContext!.gymId,
      eventId,
      body,
    );
    return NextResponse.json({ success: true, event });
  },
  {
    auth: "gym",
    schema: {
      params: accessEventIdParamsSchema,
      body: accessReconcileEventSchema,
    },
  },
);
