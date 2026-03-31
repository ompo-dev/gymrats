import { abacatePay } from "@gymrats/api/abacatepay";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { PIX_EXPIRES_IN_SECONDS } from "@/lib/utils/subscription";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  campaignId: z.string().min(1),
});

export const GET = createSafeHandler(
  async ({ personalContext, params }) => {
    const { campaignId } = paramsSchema.parse(params);
    const personalId = personalContext!.personalId;

    const campaign = await db.boostCampaign.findFirst({
      where: {
        id: campaignId,
        personalId,
        status: "pending_payment",
      },
      include: {
        personal: { select: { name: true, email: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada ou já paga" },
        { status: 404 },
      );
    }

    const pix = await abacatePay.createPixQrCode({
      amount: campaign.amountCents,
      expiresIn: PIX_EXPIRES_IN_SECONDS,
      description: `Impulsionamento: ${campaign.title}`.slice(0, 37),
      metadata: {
        campaignId: campaign.id,
        personalId,
        kind: "boost-campaign",
      },
      customer: campaign.personal?.email
        ? {
            name: campaign.personal.name ?? "Personal",
            email: campaign.personal.email,
            cellphone: "",
            taxId: "",
          }
        : undefined,
    });

    if (pix.error || !pix.data) {
      return NextResponse.json(
        { error: pix.error ?? "Erro ao gerar PIX" },
        { status: 502 },
      );
    }

    await db.boostCampaign.update({
      where: { id: campaign.id },
      data: { abacatePayBillingId: pix.data.id },
    });

    return NextResponse.json({
      success: true,
      pixId: pix.data.id,
      brCode: pix.data.brCode,
      brCodeBase64: pix.data.brCodeBase64,
      amount: pix.data.amount,
      expiresAt: pix.data.expiresAt,
    });
  },
  {
    auth: "personal",
    schema: { params: paramsSchema },
  },
);
