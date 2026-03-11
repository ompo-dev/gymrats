import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

const paramsSchema = z.object({
  gymId: z.string().min(1),
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
        benefits: p.benefits ? JSON.parse(p.benefits) : [],
      })),
    });
  },
  {
    auth: "none",
    schema: { params: paramsSchema },
  },
);
