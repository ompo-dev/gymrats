import { NextResponse } from "next/server";
import { setActiveGymSchema } from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

export const POST = createSafeHandler(
  async ({ body, gymContext }) => {
    const userId = gymContext?.user.id;
    const { gymId } = body;

    const gym = await db.gym.findFirst({
      where: {
        id: gymId,
        userId,
      },
    });

    if (!gym) {
      return NextResponse.json(
        { error: "Academia não encontrada" },
        { status: 404 },
      );
    }

    await db.user.update({
      where: { id: userId },
      data: { activeGymId: gymId },
    });

    await db.gymUserPreference.upsert({
      where: { userId },
      update: {
        lastActiveGymId: gymId,
        updatedAt: new Date(),
      },
      create: {
        userId,
        lastActiveGymId: gymId,
      },
    });

    return NextResponse.json({ activeGymId: gymId });
  },
  {
    auth: "gym",
    schema: { body: setActiveGymSchema },
  },
);
