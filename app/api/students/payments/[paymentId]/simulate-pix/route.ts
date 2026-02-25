import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { abacatePay } from "@/lib/api/abacatepay";
import { z } from "zod";

const paramsSchema = z.object({
	paymentId: z.string().min(1),
});

/**
 * POST /api/students/payments/[paymentId]/simulate-pix
 * Simula pagamento PIX em modo dev (AbacatePay).
 * Auth: student (deve ser dono do pagamento).
 */
export const POST = createSafeHandler(
	async ({ studentContext, params }) => {
		const { paymentId } = paramsSchema.parse(params);
		const studentId = studentContext!.studentId;

		const payment = await db.payment.findFirst({
			where: { id: paymentId, studentId },
			select: { id: true, abacatePayBillingId: true, status: true },
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

		const result = await abacatePay.simulatePixPayment(payment.abacatePayBillingId);

		if (result.error) {
			return NextResponse.json(
				{ error: result.error },
				{ status: 400 },
			);
		}

		if (!result.data || result.data.status !== "PAID") {
			return NextResponse.json(
				{ error: "Simulação falhou ou PIX não está em dev mode" },
				{ status: 400 },
			);
		}

		return NextResponse.json({ success: true, status: result.data.status });
	},
	{
		auth: "student",
		schema: { params: paramsSchema },
	},
);
