import { NextResponse } from "next/server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

const paramsSchema = z.object({
  personalId: z.string().min(1),
});

/**
 * GET /api/students/personals/[personalId]/profile
 * Retorna o perfil completo do personal para o aluno.
 */
export const GET = createSafeHandler(
  async ({ studentContext, params }) => {
    const { personalId } = paramsSchema.parse(params);
    const studentId = studentContext?.studentId ?? "";

    const [personal, studentsCount] = await Promise.all([
      db.personal.findUnique({
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
          studentAssignments: {
            where: { studentId, status: "active" },
            select: { id: true },
          },
        },
      }),
      db.studentPersonalAssignment.count({
        where: { personalId, status: "active" },
      }),
    ]);

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
      isSubscribed: personal.studentAssignments.length > 0,
      studentsCount,
    });
  },
  {
    auth: "student",
    schema: { params: paramsSchema },
  },
);
