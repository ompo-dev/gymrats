import { NextResponse } from "next/server";
import { abacatePay } from "@/lib/api/abacatepay";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

/**
 * Simula o pagamento de um PIX criado em modo dev.
 * POST /api/personals/subscription/simulate-pix?pixId=xxx
 * Só funciona para PIX criados em dev mode na AbacatePay.
 * Ativa a assinatura localmente (webhook pode não disparar em dev).
 */
export const POST = createSafeHandler(
  async ({ req, personalContext }) => {
    const pixId = req.nextUrl.searchParams.get("pixId");
    if (!pixId) {
      return NextResponse.json(
        { error: "pixId é obrigatório" },
        { status: 400 },
      );
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
    const personalSub = await db.personalSubscription.findFirst({
      where: {
        abacatePayBillingId: pixId,
        personalId: personalContext?.personalId,
      },
    });
    if (personalSub) {
      const now = new Date();
      const periodEnd = new Date(now);
      const isAnnual = personalSub.billingPeriod === "annual";
      if (isAnnual) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }
      await db.personalSubscription.update({
        where: { id: personalSub.id },
        data: {
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          canceledAt: null,
        },
      });
    }

    return NextResponse.json({ success: true, status: result.data.status });
  },
  {
    auth: "personal",
  },
);
