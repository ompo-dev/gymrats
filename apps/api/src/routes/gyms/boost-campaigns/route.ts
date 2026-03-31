import { abacatePay } from "@gymrats/api/abacatepay";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { GymFinancialService } from "@/lib/services/gym/gym-financial.service";
import { PIX_EXPIRES_IN_SECONDS } from "@/lib/utils/subscription";
import { NextResponse } from "@/runtime/next-server";

const createBoostCampaignSchema = z.object({
  title: z.string().min(1, "Titulo e obrigatorio"),
  description: z.string().min(1, "Descricao e obrigatoria"),
  primaryColor: z.string().min(1, "Cor principal e obrigatoria"),
  linkedCouponId: z.string().nullable().optional(),
  linkedPlanId: z.string().nullable().optional(),
  durationHours: z
    .number({ invalid_type_error: "durationHours deve ser um numero" })
    .int("durationHours deve ser inteiro")
    .positive("durationHours deve ser maior que zero"),
  amountCents: z
    .number({ invalid_type_error: "amountCents deve ser um numero" })
    .int("amountCents deve ser inteiro")
    .positive("amountCents deve ser maior que zero"),
  radiusKm: z.number().positive().optional(),
});

export const GET = createSafeHandler(
  async ({ gymContext, req }) => {
    const gymId = gymContext!.gymId;
    const fresh = new URL(req.url).searchParams.get("fresh") === "1";
    const campaigns = await GymFinancialService.getBoostCampaigns(gymId, {
      fresh,
    });

    return NextResponse.json({ campaigns });
  },
  { auth: "gym" },
);

export const POST = createSafeHandler(
  async ({ body, gymContext }) => {
    const gymId = gymContext!.gymId;
    const payload = body;
    const gym = await db.gym.findUnique({
      where: { id: gymId },
      select: { name: true, email: true },
    });

    const campaign = await db.boostCampaign.create({
      data: {
        gymId,
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
        gymId,
        kind: "boost-campaign",
      },
      customer: gym?.email
        ? {
            name: gym.name ?? "Academia",
            email: gym.email,
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
  { auth: "gym", schema: { body: createBoostCampaignSchema } },
);

export const DELETE = createSafeHandler(
  async ({ req, gymContext }) => {
    const gymId = gymContext!.gymId;
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId é obrigatório" },
        { status: 400 },
      );
    }

    const deleted = await db.boostCampaign.deleteMany({
      where: { id: campaignId, gymId },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  },
  { auth: "gym" },
);
