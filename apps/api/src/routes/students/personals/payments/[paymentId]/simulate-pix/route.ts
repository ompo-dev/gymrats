import { abacatePay } from "@gymrats/api/abacatepay";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { blockProductionDevelopmentRoute } from "@/lib/security/development-route";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  paymentId: z.string().cuid("paymentId deve ser um CUID valido"),
});

/**
 * POST /api/students/personals/payments/[paymentId]/simulate-pix
 * Simula pagamento PIX em dev. Ativa a assinatura localmente.
 */
export const POST = createSafeHandler(
  async ({ studentContext, params, req }) => {
    const { paymentId } = paramsSchema.parse(params);
    const blockedResponse = await blockProductionDevelopmentRoute({
      request: req,
      actorId: studentContext?.user.id ?? null,
      targetId: paymentId,
    });
    if (blockedResponse) {
      return blockedResponse;
    }

    const studentId = studentContext?.studentId;
    const pixId = req.nextUrl.searchParams.get("pixId");

    if (!studentId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
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

    let assignment = await db.studentPersonalAssignment.findFirst({
      where: {
        studentId: payment.studentId,
        personalId: payment.personalId,
        gymId: null,
      },
    });

    if (assignment) {
      assignment = await db.studentPersonalAssignment.update({
        where: { id: assignment.id },
        data: { status: "active" },
      });
    } else {
      assignment = await db.studentPersonalAssignment.create({
        data: {
          studentId: payment.studentId,
          personalId: payment.personalId,
          gymId: null,
          assignedBy: "PERSONAL",
          status: "active",
        },
      });
    }

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
