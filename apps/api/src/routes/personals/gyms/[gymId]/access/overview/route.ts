import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { AccessService } from "@/lib/services/access/access.service";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  gymId: z.string().min(1),
});

export const GET = createSafeHandler(
  async ({ personalContext, params }) => {
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

    const overview = await AccessService.getOverview(gymId);
    return NextResponse.json({ overview });
  },
  {
    auth: "personal",
    schema: { params: paramsSchema },
  },
);
