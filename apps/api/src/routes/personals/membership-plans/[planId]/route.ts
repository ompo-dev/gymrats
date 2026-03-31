import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  planId: z.string().min(1),
});

type MembershipPlanPatchBody = {
  name?: string;
  type?: string;
  price?: number;
  duration?: number;
  benefits?: string[] | string | null;
  isActive?: boolean;
};

function normalizeBenefits(benefits?: string[] | string | null) {
  if (benefits === undefined) {
    return undefined;
  }

  if (Array.isArray(benefits)) {
    return JSON.stringify(benefits);
  }

  return benefits ?? null;
}

function parseBenefits(benefits: string | string[] | null | undefined) {
  if (Array.isArray(benefits)) {
    return benefits;
  }

  if (typeof benefits !== "string" || benefits.length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(benefits);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const PATCH = createSafeHandler(
  async ({ personalContext, params, body }) => {
    const { planId } = paramsSchema.parse(params);
    const personalId = personalContext!.personalId;
    const payload = body as MembershipPlanPatchBody;

    const plan = await db.personalMembershipPlan.update({
      where: { id: planId, personalId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.type !== undefined ? { type: payload.type } : {}),
        ...(payload.price !== undefined ? { price: payload.price } : {}),
        ...(payload.duration !== undefined
          ? { duration: payload.duration }
          : {}),
        ...(payload.isActive !== undefined
          ? { isActive: payload.isActive }
          : {}),
        ...(payload.benefits !== undefined
          ? { benefits: normalizeBenefits(payload.benefits) }
          : {}),
      },
    });

    return NextResponse.json({
      plan: {
        ...plan,
        benefits: parseBenefits(plan.benefits),
      },
    });
  },
  {
    auth: "personal",
    schema: { params: paramsSchema },
  },
);

export const DELETE = createSafeHandler(
  async ({ personalContext, params }) => {
    const { planId } = paramsSchema.parse(params);
    const personalId = personalContext!.personalId;

    await db.personalMembershipPlan.update({
      where: { id: planId, personalId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  },
  {
    auth: "personal",
    schema: { params: paramsSchema },
  },
);
