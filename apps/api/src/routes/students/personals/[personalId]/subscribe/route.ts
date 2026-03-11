import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import { abacatePay } from "@/lib/api/abacatepay";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { PIX_EXPIRES_IN_SECONDS } from "@/lib/utils/subscription";

const paramsSchema = z.object({
  personalId: z.string().min(1),
});

const bodySchema = z.object({
  planId: z.string().min(1),
  couponId: z.string().optional().nullable(),
});

/**
 * POST /api/students/personals/[personalId]/subscribe
 * Assina um plano do personal (cria pagamento PIX e assignment após confirmação).
 */
export const POST = createSafeHandler(
  async ({ studentContext, params, body }) => {
    const { personalId } = paramsSchema.parse(params);
    const { planId, couponId } = bodySchema.parse(body);
    const studentId = studentContext?.studentId;

    if (!studentId) {
      return NextResponse.json(
        { error: "Estudante não autenticado" },
        { status: 401 },
      );
    }

    const existingAssignment = await db.studentPersonalAssignment.findFirst({
      where: { studentId, personalId, status: "active" },
    });

    if (existingAssignment && existingAssignment.status === "active") {
      return NextResponse.json(
        { error: "Você já está inscrito com este personal" },
        { status: 409 },
      );
    }

    const [personal, plan, student] = await Promise.all([
      db.personal.findUnique({
        where: { id: personalId, isActive: true },
        include: { user: { select: { email: true } } },
      }),
      db.personalMembershipPlan.findFirst({
        where: { id: planId, personalId, isActive: true },
      }),
      db.student.findUnique({
        where: { id: studentId },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    if (!personal) {
      return NextResponse.json(
        { error: "Personal não encontrado" },
        { status: 404 },
      );
    }
    if (!plan) {
      return NextResponse.json(
        { error: "Plano não encontrado ou não está ativo" },
        { status: 404 },
      );
    }
    if (!student) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 },
      );
    }

    let finalPrice = plan.price;
    let appliedCouponInfo: { code: string; discountString: string } | undefined;

    if (couponId) {
      const coupon = await db.personalCoupon.findFirst({
        where: { id: couponId, personalId, isActive: true },
      });
      if (coupon) {
        const now = new Date();
        const isExpired = !!coupon.expiresAt && coupon.expiresAt <= now;
        const isMaxed = coupon.maxUses !== -1 && coupon.currentUses >= coupon.maxUses;
        if (isExpired || isMaxed) {
          await db.personalCoupon.update({
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
          const updatedCoupon = await db.personalCoupon.update({
            where: { id: coupon.id },
            data: { currentUses: { increment: 1 } },
            select: { currentUses: true, maxUses: true },
          });
          if (
            updatedCoupon.maxUses !== -1 &&
            updatedCoupon.currentUses >= updatedCoupon.maxUses
          ) {
            await db.personalCoupon.update({
              where: { id: coupon.id },
              data: { isActive: false },
            });
          }
        }
      }
    }

    const amountCentavos = Math.round(finalPrice * 100);
    if (amountCentavos < 100) {
      return NextResponse.json(
        { error: "Valor mínimo deve ser R$ 1,00" },
        { status: 400 },
      );
    }

    const payment = await db.personalStudentPayment.create({
      data: {
        personalId,
        studentId,
        planId,
        amount: finalPrice,
        status: "pending",
      },
    });

    const pixResponse = await abacatePay.createPixQrCode({
      amount: amountCentavos,
      expiresIn: PIX_EXPIRES_IN_SECONDS,
      description: `${plan.name} - ${personal.name}`.slice(0, 37),
      metadata: {
        kind: "personal-subscription",
        paymentId: payment.id,
        personalId,
        studentId,
        planId,
      },
      customer: student.user?.email
        ? {
            name: student.user?.name ?? "Aluno",
            email: student.user.email,
            cellphone: "",
            taxId: "",
          }
        : undefined,
    });

    if (pixResponse.error || !pixResponse.data) {
      await db.personalStudentPayment.update({
        where: { id: payment.id },
        data: { status: "canceled" },
      });
      return NextResponse.json(
        { error: pixResponse.error ?? "Erro ao gerar PIX" },
        { status: 503 },
      );
    }

    await db.personalStudentPayment.update({
      where: { id: payment.id },
      data: { abacatePayBillingId: pixResponse.data.id },
    });

    return NextResponse.json({
      brCode: pixResponse.data.brCode,
      brCodeBase64: pixResponse.data.brCodeBase64,
      amount: pixResponse.data.amount,
      paymentId: payment.id,
      pixId: pixResponse.data.id,
      expiresAt: pixResponse.data.expiresAt,
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
