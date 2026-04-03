import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  personalId: z.string().cuid(),
});

/**
 * GET /api/gym/personals/[personalId]/profile
 * Retorna o perfil do personal para a academia (sem ações de assinatura).
 */
export const GET = createSafeHandler(
  async ({ gymContext, params }) => {
    const { personalId } = paramsSchema.parse(params);
    const gymId = gymContext?.gymId ?? "";

    // Verificar se o personal está vinculado à academia
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
    });

    if (!personal) {
      return NextResponse.json(
        { error: "Personal não encontrado" },
        { status: 404 },
      );
    }

    const personalWithCref = personal as typeof personal & {
      cref?: string | null;
    };

    const [gymsAffiliations, studentsCount] = await Promise.all([
      db.gymPersonalAffiliation.findMany({
        where: { personalId, status: "active" },
        include: {
          gym: { select: { id: true, name: true, address: true } },
        },
      }),
      db.studentPersonalAssignment.count({
        where: { personalId, status: "active" },
      }),
    ]);

    return NextResponse.json({
      id: personal.id,
      name: personal.name,
      avatar: personal.avatar,
      bio: personal.bio,
      email: personal.email,
      phone: personal.phone,
      cref: personalWithCref.cref ?? null,
      atendimentoPresencial: personal.atendimentoPresencial,
      atendimentoRemoto: personal.atendimentoRemoto,
      gyms: gymsAffiliations.map((a) => ({
        id: a.gym.id,
        name: a.gym.name,
        address: a.gym.address,
      })),
      studentsCount,
    });
  },
  {
    auth: "gym",
    schema: { params: paramsSchema },
  },
);
