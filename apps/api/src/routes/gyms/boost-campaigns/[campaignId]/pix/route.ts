import { abacatePay } from "@gymrats/api/abacatepay";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { PIX_EXPIRES_IN_SECONDS } from "@/lib/utils/subscription";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  campaignId: z.string().cuid("campaignId deve ser um CUID valido"),
});

export const GET = createSafeHandler(
  async ({ gymContext, params }) => {
    const { campaignId } = paramsSchema.parse(params);
    const gymId = gymContext!.gymId;

    const campaign = await db.boostCampaign.findFirst({
      where: {
        id: campaignId,
        gymId,
        status: "pending_payment",
      },
      include: {
        gym: { select: { name: true, email: true } },
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
        gymId,
        kind: "boost-campaign",
      },
      customer: campaign.gym?.email
        ? {
            name: campaign.gym.name ?? "Academia",
            email: campaign.gym.email,
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
    auth: "gym",
    schema: { params: paramsSchema },
  },
);
