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
      (db.personal as any).findUnique({
        where: { id: personalId, isActive: true },
        include: {
          gymAffiliations: {
            where: { status: "active" },
            include: {
              gym: {
              select: {
                id: true,
                name: true,
                address: true,
                logo: true,
                image: true,
              },
            },
            },
          },
          membershipPlans: {
            where: { isActive: true },
            orderBy: { price: "asc" },
          },
          studentAssignments: {
            where: { studentId, status: "active" },
            select: { id: true, status: true },
          },
        },
      }),
      db.studentPersonalAssignment.count({
        where: { personalId, status: "active" },
      }),
    ]);

    // Buscar pagamento ativo para descobrir qual plano o aluno contratou
    const activePaidPayment = studentId
      ? await (db as any).personalStudentPayment.findFirst({
          where: {
            personalId,
            studentId,
            status: "paid",
          },
          include: {
            plan: { select: { id: true, name: true, type: true, price: true, duration: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : null;

    if (!personal) {
      return NextResponse.json(
        { error: "Personal não encontrado" },
        { status: 404 },
      );
    }

    const plans = (personal as any).membershipPlans.map((p: any) => {
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

    const assignment = (personal as any).studentAssignments[0];
    const isSubscribed = !!assignment;

    return NextResponse.json({
      id: personal.id,
      name: personal.name,
      avatar: personal.avatar,
      bio: personal.bio,
      atendimentoPresencial: personal.atendimentoPresencial,
      atendimentoRemoto: personal.atendimentoRemoto,
      gyms: (personal as any).gymAffiliations.map((a: any) => ({
        id: a.gym.id,
        name: a.gym.name,
        address: a.gym.address,
        logo: a.gym.logo,
        image: a.gym.image,
      })),
      plans,
      isSubscribed,
      myAssignment: isSubscribed
        ? {
            id: assignment.id,
            status: assignment.status,
            activePlan: activePaidPayment?.plan
              ? {
                  id: activePaidPayment.plan.id,
                  name: activePaidPayment.plan.name,
                  type: activePaidPayment.plan.type,
                  price: activePaidPayment.plan.price,
                  duration: activePaidPayment.plan.duration,
                }
              : null,
          }
        : null,
      studentsCount,
    });
  },
  {
    auth: "student",
    schema: { params: paramsSchema },
  },
);
