import {
  accessHeartbeatSchema,
  accessWebhookParamsSchema,
} from "@/lib/api/schemas";
import {
  AccessService,
  createHeaderSnapshot,
} from "@/lib/services/access/access.service";
import { type NextRequest, NextResponse } from "@/runtime/next-server";

export async function POST(
  req: NextRequest,
  routeContext?: {
    params?: Promise<Record<string, string>> | Record<string, string>;
  },
) {
  try {
    const params = accessWebhookParamsSchema.parse(
      routeContext?.params ? await Promise.resolve(routeContext.params) : {},
    );
    const body = accessHeartbeatSchema.parse(await req.json());
    const result = await AccessService.recordHeartbeat(
      params.ingestionKey,
      body,
      createHeaderSnapshot(req.headers),
    );

    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao registrar heartbeat",
      },
      { status: 400 },
    );
  }
}
