import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { z } from "zod";

const paramsSchema = z.object({
	paymentId: z.string().min(1),
});

/**
 * GET /api/payments/[paymentId]
 * Retorna o status de um pagamento específico (para poll do modal PIX).
 * Auth: student (deve ser dono do pagamento).
 */
export const GET = createSafeHandler(
	async ({ studentContext, params }) => {
		const { paymentId } = paramsSchema.parse(params);
		const studentId = studentContext!.studentId;

		const payment = await db.payment.findFirst({
			where: { id: paymentId, studentId },
			select: { id: true, status: true, withdrawnAt: true },
		});

		if (!payment) {
			return NextResponse.json(
				{ error: "Pagamento não encontrado" },
				{ status: 404 },
			);
		}

		const status =
			payment.withdrawnAt !== null
				? "withdrawn"
				: (payment.status as "paid" | "pending" | "overdue" | "canceled");

		return NextResponse.json({ id: payment.id, status });
	},
	{
		auth: "student",
		schema: { params: paramsSchema },
	},
);
