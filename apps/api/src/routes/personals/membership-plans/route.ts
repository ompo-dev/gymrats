import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

type MembershipPlanBody = {
  name: string;
  description?: string | null;
  type: string;
  price: number;
  duration: number;
  benefits?: string[] | string | null;
};

function normalizeBenefits(benefits?: string[] | string | null) {
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

export const GET = createSafeHandler(
  async ({ personalContext }) => {
    const personalId = personalContext!.personalId;
    const plans = await (db as any).personalMembershipPlan.findMany({
      where: { personalId },
      orderBy: { price: "asc" },
    });

    return NextResponse.json({
      plans: (plans as Array<Record<string, unknown>>).map((plan) => ({
        ...plan,
        benefits: parseBenefits(
          plan.benefits as string | string[] | null | undefined,
        ),
      })),
    });
  },
  { auth: "personal" },
);

export const POST = createSafeHandler(
  async ({ personalContext, body }) => {
    const personalId = personalContext!.personalId;
    const payload = body as MembershipPlanBody;
    const plan = await (db as any).personalMembershipPlan.create({
      data: {
        personalId,
        name: payload.name,
        description: payload.description ?? null,
        type: payload.type,
        price: payload.price,
        duration: payload.duration,
        benefits: normalizeBenefits(payload.benefits),
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        plan: {
          ...(plan as Record<string, unknown>),
          benefits: parseBenefits(
            (plan as Record<string, unknown>).benefits as
              | string
              | string[]
              | null
              | undefined,
          ),
        },
      },
      { status: 201 },
    );
  },
  { auth: "personal" },
);
