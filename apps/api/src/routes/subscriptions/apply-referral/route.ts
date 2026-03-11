import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import { STUDENT_PLANS_CONFIG } from "@/lib/access-control/plans-config";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { ReferralService } from "@/lib/services/referral.service";
import { db } from "@/lib/db";
import { createStudentSubscriptionPix } from "@/lib/utils/subscription";

const applyReferralSchema = z.object({
  referralCode: z.string().min(1, "Informe o @ do indicador"),
});

/**
 * POST /api/subscriptions/apply-referral
 * Aplica código de indicação na assinatura pendente do aluno.
 * Gera novo PIX com 5% de desconto e vincula o referenciador (metade vai pra quem indicou no pagamento).
 */
export const POST = createSafeHandler(
  async ({ studentContext, body }) => {
    const studentId = studentContext?.studentId;
    if (!studentId) {
      return NextResponse.json(
        { error: "Aluno não autenticado" },
        { status: 401 }
      );
    }

    const referralCode = (body as { referralCode: string }).referralCode.trim();
    const normalized = referralCode.startsWith("@")
      ? referralCode
      : `@${referralCode}`;

    const subscription = await db.subscription.findUnique({
      where: { studentId },
    });

    if (!subscription || subscription.status !== "pending_payment") {
      return NextResponse.json(
        { error: "Não há assinatura pendente para aplicar indicação" },
        { status: 400 }
      );
    }

    const hasEverPaid = await db.subscriptionPayment.count({
      where: {
        subscriptionId: subscription.id,
        status: "succeeded",
      },
    });
    const canApplyReferral =
      subscription.source === "GYM_ENTERPRISE" ||
      subscription.status === "trialing" ||
      hasEverPaid === 0;

    if (!canApplyReferral) {
      return NextResponse.json(
        {
          error:
            "Indicação disponível apenas para primeira assinatura, trial ativo ou benefício Enterprise.",
        },
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
    if (referrer.id === studentId) {
      return NextResponse.json(
        { error: "Não é possível usar seu próprio código" },
        { status: 400 }
      );
    }

    const billingPeriod = (
      subscription.plan?.toLowerCase().includes("anual") ? "annual" : "monthly"
    ) as "monthly" | "annual";
    const config = STUDENT_PLANS_CONFIG.PREMIUM;
    const originalAmountCents = config.prices[billingPeriod];

    const pix = await createStudentSubscriptionPix(
      studentId,
      "premium",
      billingPeriod,
      subscription.id,
      { referralCode: normalized }
    );

    if (!pix || !pix.id) {
      return NextResponse.json(
        { error: "Erro ao gerar novo PIX" },
        { status: 500 }
      );
    }

    await db.subscription.update({
      where: { id: subscription.id },
      data: { abacatePayBillingId: pix.id },
    });

    try {
      await ReferralService.resolveReferral(normalized, "STUDENT", studentId);
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
    auth: "student",
    schema: { body: applyReferralSchema },
  }
);
