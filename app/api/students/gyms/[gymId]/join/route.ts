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
    if (!studentId) {
      return NextResponse.json(
        { error: "Estudante não autenticado" },
        { status: 401 }
      );
    }

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
    let appliedCouponInfo: { code: string; discountString: string } | undefined;

    // Cupons são salvos no banco (GymCoupon) — busca direto do DB
    if (couponId) {
      const coupon = await db.gymCoupon.findFirst({
        where: { id: couponId, gymId, isActive: true },
      });
      if (coupon) {
        const now = new Date();
        const isExpired = !!coupon.expiresAt && coupon.expiresAt <= now;
        const isMaxed = coupon.maxUses !== -1 && coupon.currentUses >= coupon.maxUses;
        if (isExpired || isMaxed) {
          await db.gymCoupon.update({
            where: { id: coupon.id },
            data: { isActive: false },
          });
        } else {
        if (coupon.discountType === "percentage") {
          finalPrice = finalPrice * (1 - coupon.discountValue / 100);
          appliedCouponInfo = { code: coupon.code, discountString: `${coupon.discountValue}%` };
        } else {
          finalPrice = finalPrice - coupon.discountValue;
          appliedCouponInfo = { code: coupon.code, discountString: `R$ ${coupon.discountValue.toFixed(2)}` };
        }
        if (finalPrice < 3.5) finalPrice = 3.5;
          // Incrementa uso e inativa automaticamente se atingiu o limite
          const updatedCoupon = await db.gymCoupon.update({
            where: { id: coupon.id },
            data: { currentUses: { increment: 1 } },
            select: { currentUses: true, maxUses: true },
          });
          if (
            updatedCoupon.maxUses !== -1 &&
            updatedCoupon.currentUses >= updatedCoupon.maxUses
          ) {
            await db.gymCoupon.update({
              where: { id: coupon.id },
              data: { isActive: false },
            });
          }
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
      planName: plan.name,
      originalPrice: plan.price,
      appliedCoupon: appliedCouponInfo,
    });
  },
  {
    auth: "student",
    schema: { params: paramsSchema, body: bodySchema },
  },
);
