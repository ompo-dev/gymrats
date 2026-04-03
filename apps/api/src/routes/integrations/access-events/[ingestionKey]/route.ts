import { accessWebhookParamsSchema } from "@/lib/api/schemas";
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
    const body = (await req.json()) as Record<string, unknown>;
    const result = await AccessService.ingestDeviceEvent(
      params.ingestionKey,
      body,
      createHeaderSnapshot(req.headers),
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
    );

    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao processar integração",
      },
      { status: 400 },
    );
  }
}
