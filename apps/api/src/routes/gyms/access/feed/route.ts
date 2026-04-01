import { accessFeedQuerySchema } from "@/lib/api/schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { AccessService } from "@/lib/services/access/access.service";
import { NextResponse } from "@/runtime/next-server";

export const GET = createSafeHandler(
  async ({ gymContext, query }) => {
    const feed = await AccessService.getFeed(gymContext!.gymId, query);
    return NextResponse.json({ feed });
  },
  {
    auth: "gym",
    schema: { query: accessFeedQuerySchema },
  },
);
