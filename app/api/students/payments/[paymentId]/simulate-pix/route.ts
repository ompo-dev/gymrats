import { NextResponse } from "next/server";
import { z } from "zod";
import { abacatePay } from "@/lib/api/abacatepay";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

const paramsSchema = z.object({
  paymentId: z.string().min(1),
});

/**
 * POST /api/students/payments/[paymentId]/simulate-pix
 * Simula pagamento PIX em modo dev (AbacatePay).
 * Replica o padrão do gym: após simulate retornar PAID, atualiza Payment e GymMembership
 * localmente (webhook pode não disparar em dev).
 * Auth: student (deve ser dono do pagamento).
 */
export const POST = createSafeHandler(
  async ({ studentContext, params }) => {
    const { paymentId } = paramsSchema.parse(params);
    const studentId = studentContext?.studentId;

    const payment = await db.payment.findFirst({
      where: { id: paymentId, studentId },
      include: {
        plan: { select: { duration: true, price: true } },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 },
      );
    }

    if (!payment.abacatePayBillingId) {
      return NextResponse.json(
        { error: "Pagamento não possui PIX associado" },
        { status: 400 },
      );
    }

    if (payment.status === "paid") {
      return NextResponse.json(
        { error: "Pagamento já foi confirmado" },
        { status: 400 },
      );
    }

    const result = await abacatePay.simulatePixPayment(
      payment.abacatePayBillingId,
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (!result.data || result.data.status !== "PAID") {
      return NextResponse.json(
        { error: "Simulação falhou ou PIX não está em dev mode" },
        { status: 400 },
      );
    }

    // Ativar localmente (igual ao gym simulate-pix - webhook pode não disparar em dev)
    let membershipId: string | null = null;
    if (payment.reference?.startsWith("membership:")) {
      membershipId = payment.reference.slice("membership:".length) || null;
    }

    if (membershipId) {
      const membership = await db.gymMembership.findFirst({
        where: { id: membershipId, studentId },
        select: { id: true, status: true },
      });

      if (membership) {
        const isChangePlan = membership.status === "active";
        const paidAt = new Date();

        await db.$transaction([
          db.payment.update({
            where: { id: payment.id },
            data: { status: "paid", date: paidAt },
          }),
          db.gymMembership.update({
            where: { id: membership.id },
            data: isChangePlan
              ? {
                  planId: payment.planId,
                  amount: payment.plan?.price ?? payment.amount,
                  nextBillingDate: payment.plan
                    ? (() => {
                        const d = new Date();
                        d.setDate(d.getDate() + payment.plan.duration);
                        return d;
                      })()
                    : payment.dueDate,
                  status: "active",
                }
              : {
                  status: "active",
                  startDate: new Date(),
                  nextBillingDate: payment.dueDate,
                },
          }),
        ]);
      } else {
        // Fallback: só atualiza Payment
        await db.payment.update({
          where: { id: payment.id },
          data: { status: "paid" },
        });
      }
    } else {
      // Sem reference membership - tenta encontrar por gym+student+plan+pending
      const pendingMembership = await db.gymMembership.findFirst({
        where: {
          gymId: payment.gymId,
          studentId,
          planId: payment.planId,
          status: "pending",
        },
        select: { id: true },
      });

      if (pendingMembership) {
        await db.$transaction([
          db.payment.update({
            where: { id: payment.id },
            data: { status: "paid" },
          }),
          db.gymMembership.update({
            where: { id: pendingMembership.id },
            data: {
              status: "active",
              startDate: new Date(),
              nextBillingDate: payment.dueDate,
            },
          }),
        ]);
      } else {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: "paid" },
        });
      }
    }

    return NextResponse.json({ success: true, status: result.data.status });
  },
  {
    auth: "student",
    schema: { params: paramsSchema },
  },
);
