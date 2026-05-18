import {
  accessHeartbeatSchema,
  accessWebhookParamsSchema,
} from "@/lib/api/schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import {
  AccessService,
  createHeaderSnapshot,
} from "@/lib/services/access/access.service";
import { NextResponse } from "@/runtime/next-server";

export const POST = createSafeHandler(
  async ({ req, params, body }) => {
    const result = await AccessService.recordHeartbeat(
      params!.ingestionKey,
      body,
      createHeaderSnapshot(req.headers),
    );

    return NextResponse.json(result, { status: 202 });
  },
  {
    schema: {
      params: accessWebhookParamsSchema,
      body: accessHeartbeatSchema,
    },
  },
);
