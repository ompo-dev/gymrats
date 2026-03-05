import { NextResponse } from "next/server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

const paramsSchema = z.object({
  personalId: z.string().min(1),
});

/**
 * GET /api/gym/personals/[personalId]/profile
 * Retorna o perfil do personal para a academia (apenas personais vinculados).
 * Modo visualização - academia não pode assinar planos.
 */
export const GET = createSafeHandler(
  async ({ gymContext, params }) => {
    const { personalId } = paramsSchema.parse(params);
    const gymId = gymContext?.gymId;

    if (!gymId) {
      return NextResponse.json(
        { error: "Não autenticado como academia" },
        { status: 401 },
      );
    }

    const affiliation = await db.gymPersonalAffiliation.findFirst({
      where: { personalId, gymId, status: "active" },
    });

    if (!affiliation) {
      return NextResponse.json(
        { error: "Personal não vinculado a esta academia" },
        { status: 404 },
      );
    }

    const personal = await db.personal.findUnique({
      where: { id: personalId, isActive: true },
      include: {
        gymAffiliations: {
          where: { status: "active" },
          include: {
            gym: { select: { id: true, name: true, address: true } },
          },
        },
        membershipPlans: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
      },
    });

    if (!personal) {
      return NextResponse.json(
        { error: "Personal não encontrado" },
        { status: 404 },
      );
    }

    const plans = personal.membershipPlans.map((p) => {
      let benefits: string[] = [];
      if (p.benefits) {
        try {
          benefits = JSON.parse(p.benefits);
        } catch {}
      }
      return {
        id: p.id,
        name: p.name,
        type: p.type,
        price: p.price,
        duration: p.duration,
        benefits,
      };
    });

    return NextResponse.json({
      id: personal.id,
      name: personal.name,
      avatar: personal.avatar,
      bio: personal.bio,
      atendimentoPresencial: personal.atendimentoPresencial,
      atendimentoRemoto: personal.atendimentoRemoto,
      gyms: personal.gymAffiliations.map((a) => ({
        id: a.gym.id,
        name: a.gym.name,
        address: a.gym.address,
      })),
      plans,
    });
  },
  {
    auth: "gym",
    schema: { params: paramsSchema },
  },
);
