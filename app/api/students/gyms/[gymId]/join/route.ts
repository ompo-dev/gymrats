import { NextResponse } from "next/server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { createMembershipPaymentPix } from "@/lib/services/gym/gym-membership-payment.service";

const paramsSchema = z.object({
  gymId: z.string().min(1),
});

const bodySchema = z.object({
  planId: z.string().min(1),
});

export const POST = createSafeHandler(
  async ({ studentContext, params, body }) => {
    const { gymId } = paramsSchema.parse(params);
    const { planId } = bodySchema.parse(body);
    const studentId = studentContext?.studentId;

    const existingMembership = await db.gymMembership.findFirst({
      where: { gymId, studentId, status: { in: ["active", "pending"] } },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Você já está matriculado nesta academia" },
        { status: 409 },
      );
    }

    const plan = await db.membershipPlan.findUnique({
      where: { id: planId, gymId, isActive: true },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plano não encontrado ou não está ativo" },
        { status: 404 },
      );
    }

    // Todo aluno paga a mensalidade da academia. Benefício Premium do app é concedido
    // apenas quando a academia é enterprise (sync no webhook ao ativar a membership).
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + plan.duration);

    const membership = await db.gymMembership.create({
      data: {
        gymId,
        studentId,
        planId,
        amount: plan.price,
        status: "pending",
        autoRenew: true,
        nextBillingDate,
      },
    });

    const result = await createMembershipPaymentPix(
      gymId,
      studentId,
      planId,
      plan.price,
      { membershipId: membership.id },
    );

    return NextResponse.json({
      ...result,
      membershipId: membership.id,
    });
  },
  {
    auth: "student",
    schema: { params: paramsSchema, body: bodySchema },
  },
);
