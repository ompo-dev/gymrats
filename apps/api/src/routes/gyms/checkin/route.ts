import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { AccessService } from "@/lib/services/access/access.service";
import { NextResponse } from "@/runtime/next-server";

const checkInSchema = z.object({
  studentId: z.string().min(1, "studentId é obrigatório"),
});

export const POST = createSafeHandler(
  async ({ body, gymContext }) => {
    try {
      const { checkIn } = await AccessService.createLegacyGymCheckIn(
        gymContext!.gymId,
        body.studentId,
      );
      return NextResponse.json({ success: true, checkIn }, { status: 201 });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao registrar check-in";
      const status =
        message.includes("aberta") || message.includes("aberto")
          ? 409
          : message.includes("não encontrado")
            ? 404
            : 400;
      return NextResponse.json({ error: message }, { status });
    }
  },
  {
    auth: "gym",
    schema: { body: checkInSchema },
  },
);
