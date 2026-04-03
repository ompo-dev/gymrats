import { z } from "zod";
import { accessFeedQuerySchema } from "@/lib/api/schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { AccessService } from "@/lib/services/access/access.service";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  gymId: z.string().cuid("gymId deve ser um CUID valido"),
});

export const GET = createSafeHandler(
  async ({ personalContext, params, query }) => {
    const { gymId } = paramsSchema.parse(params);
    const affiliation = await db.gymPersonalAffiliation.findFirst({
      where: {
        gymId,
        personalId: personalContext!.personalId,
        status: "active",
      },
    });

    if (!affiliation) {
      return NextResponse.json({ error: "Academia não disponível" }, { status: 404 });
    }

    const feed = await AccessService.getFeed(gymId, query);
    return NextResponse.json({ feed });
  },
  {
    auth: "personal",
    schema: {
      params: paramsSchema,
      query: accessFeedQuerySchema,
    },
  },
);
