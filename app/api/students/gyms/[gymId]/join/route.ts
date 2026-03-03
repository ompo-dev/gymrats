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
  couponId: z.string().optional().nullable(),
});

export const POST = createSafeHandler(
  async ({ studentContext, params, body }) => {
    const { gymId } = paramsSchema.parse(params);
    const { planId, couponId } = bodySchema.parse(body);
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

    let finalPrice = plan.price;
    if (couponId) {
      const coupon = await db.coupon.findFirst({
        where: {
          id: couponId,
          gymId,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      });
      // se n expirou, isActive e é do gym
      if (coupon) {
        if (
          coupon.usageLimit === null ||
          coupon.usageCount < coupon.usageLimit
        ) {
          if (coupon.discountType === "percentage") {
            finalPrice = finalPrice * (1 - coupon.discountValue / 100);
          } else {
            finalPrice = finalPrice - coupon.discountValue;
          }
          if (finalPrice < 3.5) finalPrice = 3.5;
          await db.coupon.update({
            where: { id: coupon.id },
            data: { usageCount: { increment: 1 } },
          });
        }
      }
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
        amount: finalPrice,
        status: "pending",
        autoRenew: true,
        nextBillingDate,
      },
    });

    const result = await createMembershipPaymentPix(
      gymId,
      studentId,
      planId,
      finalPrice,
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
