import { NextResponse } from "@/runtime/next-server";
import { abacatePay } from "@gymrats/api/abacatepay";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { ReferralService } from "@/lib/services/referral.service";

/**
 * Simula o pagamento de um PIX de assinatura student em modo dev.
 * POST /api/subscriptions/simulate-pix?pixId=xxx
 * Só funciona para PIX criados em dev mode na AbacatePay.
 * Ativa a assinatura localmente (webhook pode não disparar em dev).
 */
export const POST = createSafeHandler(
  async ({ req, studentContext }) => {
    const pixId = req.nextUrl.searchParams.get("pixId");
    if (!pixId) {
      return NextResponse.json(
        { error: "pixId é obrigatório" },
        { status: 400 },
      );
    }

    const studentId = studentContext?.studentId;
    if (!studentId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const result = await abacatePay.simulatePixPayment(pixId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (!result.data || result.data.status !== "PAID") {
      return NextResponse.json(
        { error: "Simulação falhou ou PIX não está em dev mode" },
        { status: 400 },
      );
    }

    // Ativar assinatura localmente (webhook pode não disparar em dev)
    let sub = await db.subscription.findFirst({
      where: {
        studentId,
        abacatePayBillingId: pixId,
      },
    });
    // Fallback para PIXs antigos que não salvaram abacatePayBillingId
    if (!sub) {
      sub = await db.subscription.findFirst({
        where: {
          studentId,
          status: "pending_payment",
        },
        orderBy: { updatedAt: "desc" },
      });
    }
    if (sub) {
      const now = new Date();
      const periodEnd = new Date(now);
      const isAnnual = sub.billingPeriod === "annual";
      if (isAnnual) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }
      await db.subscription.update({
        where: { id: sub.id },
        data: {
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          canceledAt: null,
        },
      });

      // Creditar comissão de indicação (igual ao webhook — webhook pode não disparar em dev)
      const amountCents = result.data.amount ?? 0;
      if (amountCents > 0) {
        await ReferralService.onFirstPaymentConfirmed(
          "STUDENT",
          studentId,
          amountCents,
          pixId,
        );
      }
    }

    return NextResponse.json({ success: true, status: result.data.status });
  },
  {
    auth: "student",
  },
);
