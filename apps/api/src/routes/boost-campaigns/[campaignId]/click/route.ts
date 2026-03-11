import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

/**
 * POST /api/boost-campaigns/[campaignId]/click
 * Registra clique no anúncio. Cada aluno conta no máximo 1x por campanha.
 */
export const POST = createSafeHandler(
  async ({ studentContext, params }) => {
    const studentId = studentContext?.studentId;
    if (!studentId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const campaignId = params?.campaignId;
    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId é obrigatório" },
        { status: 400 }
      );
    }

    const campaign = await db.boostCampaign.findUnique({
      where: { id: campaignId, status: "active" },
    });
    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada ou inativa" },
        { status: 404 }
      );
    }

    const existing = await db.boostCampaignEngagement.findUnique({
      where: {
        campaignId_studentId: { campaignId, studentId },
      },
    });

    if (existing?.clickAt) {
      return NextResponse.json({ ok: true, alreadyCounted: true });
    }

    await db.$transaction(async (tx) => {
      await tx.boostCampaignEngagement.upsert({
        where: {
          campaignId_studentId: { campaignId, studentId },
        },
        create: {
          campaignId,
          studentId,
          clickAt: new Date(),
        },
        update: {
          clickAt: new Date(),
        },
      });
      await tx.boostCampaign.update({
        where: { id: campaignId },
        data: { clicks: { increment: 1 } },
      });
    });

    return NextResponse.json({ ok: true });
  },
  { auth: "student" }
);
