import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { abacatePay } from "@gymrats/api/abacatepay";
import { PIX_EXPIRES_IN_SECONDS } from "@/lib/utils/subscription";

type CreateBoostCampaignBody = {
  title: string;
  description: string;
  primaryColor: string;
  linkedCouponId: string | null;
  linkedPlanId: string | null;
  durationHours: number;
  amountCents: number;
  radiusKm?: number;
};

export const GET = createSafeHandler(
  async ({ personalContext }) => {
    const personalId = personalContext!.personalId;
    const now = new Date();

    await db.boostCampaign.updateMany({
      where: {
        personalId,
        status: "active",
        endsAt: { lte: now },
      },
      data: { status: "expired" },
    });

    const campaigns = await db.boostCampaign.findMany({
      where: { personalId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ campaigns });
  },
  { auth: "personal" },
);

export const POST = createSafeHandler(
  async ({ body, personalContext }) => {
    const personalId = personalContext!.personalId;
    const payload = body as CreateBoostCampaignBody;
    const personal = await db.personal.findUnique({
      where: { id: personalId },
      select: { name: true, email: true },
    });

    const campaign = await db.boostCampaign.create({
      data: {
        personalId,
        title: payload.title,
        description: payload.description,
        primaryColor: payload.primaryColor,
        linkedCouponId: payload.linkedCouponId,
        linkedPlanId: payload.linkedPlanId,
        durationHours: payload.durationHours,
        amountCents: payload.amountCents,
        radiusKm: payload.radiusKm ?? 5,
        status: "pending_payment",
      },
    });

    const pix = await abacatePay.createPixQrCode({
      amount: payload.amountCents,
      expiresIn: PIX_EXPIRES_IN_SECONDS,
      description: `Impulsionamento: ${payload.title}`.slice(0, 37),
      metadata: {
        campaignId: campaign.id,
        personalId,
        kind: "boost-campaign",
      },
      customer: personal?.email
        ? {
            name: personal.name ?? "Personal",
            email: personal.email,
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

    return NextResponse.json(
      {
        success: true,
        campaignId: campaign.id,
        pixId: pix.data.id,
        brCode: pix.data.brCode,
        brCodeBase64: pix.data.brCodeBase64,
        amount: pix.data.amount,
        expiresAt: pix.data.expiresAt,
      },
      { status: 201 },
    );
  },
  { auth: "personal" },
);

export const DELETE = createSafeHandler(
  async ({ req, personalContext }) => {
    const personalId = personalContext!.personalId;
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId é obrigatório" },
        { status: 400 },
      );
    }

    const deleted = await db.boostCampaign.deleteMany({
      where: { id: campaignId, personalId },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  },
  { auth: "personal" },
);
