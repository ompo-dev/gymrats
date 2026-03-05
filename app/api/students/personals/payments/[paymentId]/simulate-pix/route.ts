import { NextResponse } from "next/server";
import { z } from "zod";
import { abacatePay } from "@/lib/api/abacatepay";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

const paramsSchema = z.object({
  paymentId: z.string().min(1),
});

/**
 * POST /api/students/personals/payments/[paymentId]/simulate-pix
 * Simula pagamento PIX em dev. Ativa a assinatura localmente.
 */
export const POST = createSafeHandler(
  async ({ studentContext, params, req }) => {
    const { paymentId } = paramsSchema.parse(params);
    const studentId = studentContext?.studentId;
    const pixId = req.nextUrl.searchParams.get("pixId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 },
      );
    }

    const payment = await db.personalStudentPayment.findFirst({
      where: { id: paymentId, studentId, status: "pending" },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado ou já processado" },
        { status: 404 },
      );
    }

    const billingId = pixId || payment.abacatePayBillingId;
    if (!billingId) {
      return NextResponse.json(
        { error: "PIX não associado ao pagamento" },
        { status: 400 },
      );
    }

    const result = await abacatePay.simulatePixPayment(billingId);

    if (result.error || !result.data || result.data.status !== "PAID") {
      return NextResponse.json(
        { error: result.error ?? "Simulação falhou" },
        { status: 400 },
      );
    }

    const assignment = await db.studentPersonalAssignment.upsert({
      where: {
        studentId_personalId: {
          studentId: payment.studentId,
          personalId: payment.personalId,
        },
      },
      create: {
        studentId: payment.studentId,
        personalId: payment.personalId,
        assignedBy: "PERSONAL",
        status: "active",
      },
      update: { status: "active" },
    });

    await db.personalStudentPayment.update({
      where: { id: payment.id },
      data: { status: "paid", assignmentId: assignment.id },
    });

    return NextResponse.json({ success: true, status: "paid" });
  },
  {
    auth: "student",
    schema: { params: paramsSchema },
  },
);
