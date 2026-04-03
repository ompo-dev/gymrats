import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { PersonalFinancialService } from "@/lib/services/personal/personal-financial.service";
import { parseJsonArray } from "@/lib/utils/json";
import { NextResponse } from "@/runtime/next-server";

type MembershipPlanBody = {
  name: string;
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

  return parseJsonArray<string>(benefits);
}

export const GET = createSafeHandler(
  async ({ personalContext, req }) => {
    const personalId = personalContext!.personalId;
    const fresh = new URL(req.url).searchParams.get("fresh") === "1";
    const plans = await PersonalFinancialService.getMembershipPlans(
      personalId,
      {
        fresh,
      },
    );

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
    const plan = await db.personalMembershipPlan.create({
      data: {
        personalId,
        name: payload.name,
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
          ...plan,
          benefits: parseBenefits(plan.benefits),
        },
      },
      { status: 201 },
    );
  },
  { auth: "personal" },
);
