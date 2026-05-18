import {
  accessAuthorizationRequestSchema,
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
    const result = await AccessService.authorizeAccess(
      params!.ingestionKey,
      body,
      createHeaderSnapshot(req.headers),
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
    );

    return NextResponse.json(result, { status: 200 });
  },
  {
    schema: {
      params: accessWebhookParamsSchema,
      body: accessAuthorizationRequestSchema,
    },
  },
);
