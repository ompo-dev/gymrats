import { NextResponse } from "next/server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

const checkOutSchema = z.object({
  checkInId: z.string().min(1, "checkInId é obrigatório"),
});

export const POST = createSafeHandler(
  async ({ body, gymContext }) => {
    const { gymId } = gymContext!;
    const { checkInId } = body;

    const checkIn = await db.checkIn.findUnique({ where: { id: checkInId } });

    if (!checkIn || checkIn.gymId !== gymId) {
      return NextResponse.json(
        { error: "Check-in não encontrado" },
        { status: 404 },
      );
    }

    if (checkIn.checkOut) {
      return NextResponse.json(
        { error: "Checkout já realizado" },
        { status: 409 },
      );
    }

    const now = new Date();
    const duration = Math.round(
      (now.getTime() - checkIn.timestamp.getTime()) / (1000 * 60),
    ); // minutos

    const updated = await db.checkIn.update({
      where: { id: checkInId },
      data: { checkOut: now, duration },
    });

    return NextResponse.json({ success: true, checkIn: updated });
  },
  {
    auth: "gym",
    schema: { body: checkOutSchema },
  },
);
