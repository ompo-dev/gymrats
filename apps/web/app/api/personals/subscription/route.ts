import { NextResponse } from "next/server";
import { personalSubscriptionSchema } from "@/lib/api/schemas/personals.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { PersonalSubscriptionService } from "@/lib/services/personal/personal-subscription.service";
import { createPersonalSubscriptionPix } from "@/lib/utils/subscription";
import { db } from "@/lib/db";
import { featureFlags } from "@/lib/feature-flags";

export const GET = createSafeHandler(
  async ({ personalContext }) => {
    if (!featureFlags.personalEnabled || !featureFlags.personalBillingEnabled) {
      return NextResponse.json(
        { error: "Billing de Personal desabilitado" },
        { status: 503 },
      );
    }
    const personalId = personalContext?.personalId;
    const subscription = await db.personalSubscription.findUnique({
      where: { personalId },
    });
    return NextResponse.json({ subscription });
  },
  { auth: "personal" },
);

export const POST = createSafeHandler(
  async ({ personalContext, body }) => {
    if (!featureFlags.personalEnabled || !featureFlags.personalBillingEnabled) {
      return NextResponse.json(
        { error: "Billing de Personal desabilitado" },
        { status: 503 },
      );
    }
    const personalId = personalContext?.personalId || "";
    const { plan, billingPeriod } = body as {
      plan: "standard" | "pro_ai";
      billingPeriod: "monthly" | "annual";
    };

    const subscription = await PersonalSubscriptionService.upsertSubscription({
      personalId,
      plan,
      billingPeriod,
    });

    const pix = await createPersonalSubscriptionPix(
      personalId,
      plan,
      billingPeriod,
      subscription.id,
    );

    if (pix) {
      await db.personalSubscription.update({
        where: { id: subscription.id },
        data: { abacatePayBillingId: pix.id },
      });
      return NextResponse.json({
        subscription,
        pix: {
          pixId: pix.id,
          brCode: pix.brCode,
          brCodeBase64: pix.brCodeBase64,
          amount: pix.amount,
          expiresAt: pix.expiresAt,
        },
      });
    }

    return NextResponse.json({ subscription });
  },
  { auth: "personal", schema: { body: personalSubscriptionSchema } },
);
