import { NextResponse } from "next/server";
import { z } from "zod";
import { GYM_PLANS_CONFIG } from "@/lib/access-control/plans-config";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { ReferralService } from "@/lib/services/referral.service";
import { db } from "@/lib/db";
import { createGymSubscriptionPix } from "@/lib/utils/subscription";

const applyReferralSchema = z.object({
  referralCode: z.string().min(1, "Informe o @ do aluno indicador"),
});

/**
 * POST /api/gym-subscriptions/apply-referral
 * Aplica código de indicação na assinatura pendente da academia.
 * Gera novo PIX com 5% de desconto e vincula o referenciador (metade vai pra quem indicou no pagamento).
 */
export const POST = createSafeHandler(
  async ({ gymContext, body }) => {
    const gymId = gymContext?.gymId;
    if (!gymId) {
      return NextResponse.json(
        { error: "Academia não autenticada" },
        { status: 401 }
      );
    }

    const referralCode = (body as { referralCode: string }).referralCode.trim();
    const normalized = referralCode.startsWith("@") ? referralCode : `@${referralCode}`;

    const subscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    if (
      !subscription ||
      subscription.status !== "pending_payment" ||
      !subscription.abacatePayBillingId
    ) {
      return NextResponse.json(
        { error: "Não há assinatura pendente para aplicar indicação" },
        { status: 400 }
      );
    }

    const referrer = await db.student.findUnique({
      where: { referralCode: normalized },
    });
    if (!referrer) {
      return NextResponse.json(
        {
          error: "Código de indicação inválido",
          referralCodeInvalid: true,
        },
        { status: 400 }
      );
    }

    const activeStudents = await db.gymMembership.count({
      where: { gymId, status: "active" },
    });

    const config =
      GYM_PLANS_CONFIG[
        subscription.plan.toUpperCase() as keyof typeof GYM_PLANS_CONFIG
      ];
    if (!config) {
      return NextResponse.json(
        { error: "Configuração do plano inválida" },
        { status: 400 }
      );
    }
    const basePrice =
      config.prices[subscription.billingPeriod as "monthly" | "annual"];
    const perStudentTotal =
      subscription.billingPeriod === "annual"
        ? 0
        : config.pricePerStudent * activeStudents;
    const originalAmountCents = basePrice + perStudentTotal;

    const pix = await createGymSubscriptionPix(
      gymId,
      subscription.plan as "basic" | "premium" | "enterprise",
      activeStudents,
      subscription.billingPeriod as "monthly" | "annual",
      subscription.id,
      { referralCode: normalized }
    );

    if (!pix || !pix.id) {
      return NextResponse.json(
        { error: "Erro ao gerar novo PIX" },
        { status: 500 }
      );
    }

    await db.gymSubscription.update({
      where: { id: subscription.id },
      data: { abacatePayBillingId: pix.id },
    });

    try {
      await ReferralService.resolveReferral(normalized, "GYM", gymId);
    } catch {
      /* Não bloqueia — referral pode já existir */
    }

    return NextResponse.json({
      pixId: pix.id,
      brCode: pix.brCode,
      brCodeBase64: pix.brCodeBase64,
      amount: pix.amount,
      expiresAt: pix.expiresAt,
      originalAmount: originalAmountCents,
    });
  },
  {
    auth: "gym",
    schema: { body: applyReferralSchema },
  }
);
