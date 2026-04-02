import { z } from "zod";
import { accessManualEventSchema } from "@/lib/api/schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { AccessService } from "@/lib/services/access/access.service";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  gymId: z.string().cuid("gymId deve ser um CUID valido"),
});

export const POST = createSafeHandler(
  async ({ personalContext, params, body }) => {
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

    const event = await AccessService.createManualEventForPersonal(
      gymId,
      personalContext!.personalId,
      body,
      {
        actorRole: "PERSONAL",
        actorUserId: personalContext?.user?.id
          ? String(personalContext.user.id)
          : null,
      },
    );

    return NextResponse.json({ success: true, event }, { status: 201 });
  },
  {
    auth: "personal",
    schema: {
      params: paramsSchema,
      body: accessManualEventSchema,
    },
  },
);
