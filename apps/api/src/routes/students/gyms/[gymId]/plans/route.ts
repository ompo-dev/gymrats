import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/utils/json";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  gymId: z.string().cuid("gymId deve ser um CUID valido"),
});

export const GET = createSafeHandler(
  async ({ params }) => {
    const { gymId } = paramsSchema.parse(params);

    const plans = await db.membershipPlan.findMany({
      where: { gymId, isActive: true },
      orderBy: { price: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        price: true,
        duration: true,
        benefits: true,
      },
    });

    return NextResponse.json({
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        price: p.price,
        duration: p.duration,
        benefits: parseJsonArray<string>(p.benefits),
      })),
    });
  },
  {
    auth: "none",
    schema: { params: paramsSchema },
  },
);
