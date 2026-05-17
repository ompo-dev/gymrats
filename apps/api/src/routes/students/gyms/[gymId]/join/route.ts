import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { createMembershipPaymentPix } from "@/lib/services/gym/gym-membership-payment.service";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  gymId: z.string().cuid("gymId deve ser um CUID valido"),
});

const bodySchema = z.object({
  planId: z.string().cuid("planId deve ser um CUID valido"),
  couponId: z.string().cuid("couponId deve ser um CUID valido").optional().nullable(),
});

export const POST = createSafeHandler(
  async ({ studentContext, params, body }) => {
    const { gymId } = paramsSchema.parse(params);
    const { planId, couponId } = bodySchema.parse(body);
    const studentId = studentContext?.studentId;
    if (!studentId) {
      return NextResponse.json(
        { error: "Estudante nao autenticado" },
        { status: 401 },
      );
    }

    const existingMembership = await db.gymMembership.findFirst({
      where: { gymId, studentId, status: { in: ["active", "pending"] } },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Voce ja esta matriculado nesta academia" },
        { status: 409 },
      );
    }

    const plan = await db.membershipPlan.findUnique({
      where: { id: planId, gymId, isActive: true },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plano nao encontrado ou nao esta ativo" },
        { status: 404 },
      );
    }

    const now = new Date();
    let finalPrice = plan.price;
    let appliedCouponInfo: { code: string; discountString: string } | undefined;
    let consumedCouponId: string | null = null;

    if (couponId) {
      const coupon = await db.gymCoupon.findFirst({
        where: { id: couponId, gymId, isActive: true },
      });
      if (coupon) {
        const isExpired = !!coupon.expiresAt && coupon.expiresAt <= now;
        const isMaxed =
          coupon.maxUses !== -1 && coupon.currentUses >= coupon.maxUses;
        if (isExpired || isMaxed) {
          await db.gymCoupon.update({
            where: { id: coupon.id },
            data: { isActive: false },
          });
        } else {
          if (coupon.discountType === "percentage") {
            finalPrice = finalPrice * (1 - coupon.discountValue / 100);
            appliedCouponInfo = {
              code: coupon.code,
              discountString: `${coupon.discountValue}%`,
            };
          } else {
            finalPrice = finalPrice - coupon.discountValue;
            appliedCouponInfo = {
              code: coupon.code,
              discountString: `R$ ${coupon.discountValue.toFixed(2)}`,
            };
          }

          if (finalPrice < 3.5) finalPrice = 3.5;

          const consumeResult = await db.gymCoupon.updateMany({
            where: {
              id: coupon.id,
              gymId,
              isActive: true,
              ...(coupon.maxUses !== -1
                ? { currentUses: { lt: coupon.maxUses } }
                : {}),
              ...(coupon.expiresAt ? { expiresAt: { gt: now } } : {}),
            },
            data: { currentUses: { increment: 1 } },
          });

          if (consumeResult.count === 0) {
            return NextResponse.json(
              { error: "Cupom indisponivel. Atualize e tente novamente." },
              { status: 409 },
            );
          }

          consumedCouponId = coupon.id;
          const updatedCoupon = await db.gymCoupon.findUnique({
            where: { id: coupon.id },
            select: { currentUses: true, maxUses: true },
          });

          if (
            updatedCoupon &&
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

    try {
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
    } catch (error) {
      await db.gymMembership.update({
        where: { id: membership.id },
        data: { status: "canceled", autoRenew: false },
      });

      if (consumedCouponId) {
        await db.gymCoupon.updateMany({
          where: { id: consumedCouponId, currentUses: { gt: 0 } },
          data: { currentUses: { decrement: 1 }, isActive: true },
        });
      }

      const message =
        error instanceof Error
          ? error.message
          : "Falha ao gerar cobranca PIX para esta matricula.";
      return NextResponse.json({ error: message }, { status: 503 });
    }
  },
  {
    auth: "student",
    schema: { params: paramsSchema, body: bodySchema },
  },
);
