import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { AccessService } from "@/lib/services/access/access.service";
import { NextResponse } from "@/runtime/next-server";

const checkOutSchema = z.object({
  checkInId: z.string().min(1, "checkInId é obrigatório"),
});

export const POST = createSafeHandler(
  async ({ body, gymContext }) => {
    try {
      const checkIn = await AccessService.closeLegacyGymCheckIn(
        gymContext!.gymId,
        body.checkInId,
      );
      return NextResponse.json({ success: true, checkIn });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao registrar checkout";
      const status = message.includes("não encontrado")
        ? 404
        : message.includes("aberta")
          ? 409
          : 400;
      return NextResponse.json({ error: message }, { status });
    }
  },
  {
    auth: "gym",
    schema: { body: checkOutSchema },
  },
);
