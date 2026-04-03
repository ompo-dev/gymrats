import { accessManualEventSchema } from "@/lib/api/schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { AccessService } from "@/lib/services/access/access.service";
import { NextResponse } from "@/runtime/next-server";

export const POST = createSafeHandler(
  async ({ gymContext, body }) => {
    const event = await AccessService.createManualEventForGym(
      gymContext!.gymId,
      body,
      {
        actorRole: "GYM",
        actorUserId: gymContext?.user?.id ? String(gymContext.user.id) : null,
      },
    );

    return NextResponse.json({ success: true, event }, { status: 201 });
  },
  {
    auth: "gym",
    schema: { body: accessManualEventSchema },
  },
);
