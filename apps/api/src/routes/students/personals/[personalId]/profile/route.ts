import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { NextResponse } from "@/runtime/next-server";

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
      ? await db.personalStudentPayment.findFirst({
          where: {
            personalId,
            studentId,
            status: "paid",
          },
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                type: true,
                price: true,
                duration: true,
              },
            },
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

    const plans = personal.membershipPlans.map((plan) => {
      let benefits: string[] = [];
      if (plan.benefits) {
        try {
          benefits = JSON.parse(plan.benefits);
        } catch {}
      }
      return {
        id: plan.id,
        name: plan.name,
        type: plan.type,
        price: plan.price,
        duration: plan.duration,
        benefits,
      };
    });

    const assignment = personal.studentAssignments[0];
    const isSubscribed = !!assignment;

    return NextResponse.json({
      id: personal.id,
      name: personal.name,
      avatar: personal.avatar,
      bio: personal.bio,
      atendimentoPresencial: personal.atendimentoPresencial,
      atendimentoRemoto: personal.atendimentoRemoto,
      gyms: personal.gymAffiliations.map((affiliation) => ({
        id: affiliation.gym.id,
        name: affiliation.gym.name,
        address: affiliation.gym.address,
        logo: affiliation.gym.logo,
        image: affiliation.gym.image,
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
