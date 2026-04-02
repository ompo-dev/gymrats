import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  campaignId: z.string().cuid("campaignId deve ser um CUID valido"),
});

/**
 * GET /api/personals/boost-campaigns/[campaignId]
 * Retorna o status da campanha para polling do modal PIX.
 */
export const GET = createSafeHandler(
  async ({ personalContext, params }) => {
    const { campaignId } = paramsSchema.parse(params);

    const campaign = await db.boostCampaign.findFirst({
      where: { id: campaignId, personalId: personalContext!.personalId },
      select: { id: true, status: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 },
      );
    }

    const now = new Date();
    const status =
      campaign.status === "active"
        ? (
            await db.boostCampaign.updateMany({
              where: {
                id: campaign.id,
                status: "active",
                endsAt: { lte: now },
              },
              data: { status: "expired" },
            })
          ).count > 0
          ? "expired"
          : campaign.status
        : campaign.status;

    return NextResponse.json({ status });
  },
  { auth: "personal", schema: { params: paramsSchema } },
);
