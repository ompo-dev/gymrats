import { NextResponse } from "next/server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

const paramsSchema = z.object({ campaignId: z.string().min(1) });

/**
 * GET /api/gym/boost-campaigns/[campaignId]
 * Retorna o status da campanha para polling do modal PIX.
 */
export const GET = createSafeHandler(
  async ({ gymContext, params }) => {
    const { campaignId } = paramsSchema.parse(params);

    const campaign = await db.boostCampaign.findFirst({
      where: { id: campaignId, gymId: gymContext!.gymId },
      select: { id: true, status: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ status: campaign.status });
  },
  { auth: "gym", schema: { params: paramsSchema } },
);
