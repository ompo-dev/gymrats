import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import { abacatePay } from "@gymrats/api/abacatepay";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

const paramsSchema = z.object({ campaignId: z.string().min(1) });

/**
 * POST /api/gym/boost-campaigns/[campaignId]/simulate-pix
 * Simula pagamento PIX em dev e ativa a campanha localmente.
 */
export const POST = createSafeHandler(
  async ({ gymContext, params }) => {
    const { campaignId } = paramsSchema.parse(params);

    const campaign = await db.boostCampaign.findFirst({
      where: { id: campaignId, gymId: gymContext!.gymId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 },
      );
    }

    if (!campaign.abacatePayBillingId) {
      return NextResponse.json(
        { error: "PIX não associado à campanha" },
        { status: 400 },
      );
    }

    if (campaign.status === "active") {
      return NextResponse.json(
        { error: "Campanha já está ativa" },
        { status: 400 },
      );
    }

    const result = await abacatePay.simulatePixPayment(
      campaign.abacatePayBillingId,
    );

    if (result.error || !result.data || result.data.status !== "PAID") {
      return NextResponse.json(
        { error: result.error ?? "Simulação falhou" },
        { status: 400 },
      );
    }

    // Ativa a campanha localmente
    const now = new Date();
    const endsAt = new Date(
      now.getTime() + campaign.durationHours * 60 * 60 * 1000,
    );

    await db.boostCampaign.update({
      where: { id: campaign.id },
      data: { status: "active", startsAt: now, endsAt },
    });

    return NextResponse.json({ success: true, status: "PAID" });
  },
  { auth: "gym", schema: { params: paramsSchema } },
);
