import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { abacatePay } from "@/lib/api/abacatepay";
import { db } from "@/lib/db";

/**
 * Simula o pagamento de um PIX criado em modo dev.
 * POST /api/gym-subscriptions/simulate-pix?pixId=xxx
 * Só funciona para PIX criados em dev mode na AbacatePay.
 * Ativa a assinatura localmente (webhook pode não disparar em dev).
 */
export const POST = createSafeHandler(
	async ({ req, gymContext }) => {
		const pixId = req.nextUrl.searchParams.get("pixId");
		if (!pixId) {
			return NextResponse.json(
				{ error: "pixId é obrigatório" },
				{ status: 400 },
			);
		}

		const result = await abacatePay.simulatePixPayment(pixId);

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

		// Ativar assinatura localmente (webhook pode não disparar em dev)
		const gymSub = await db.gymSubscription.findFirst({
			where: { abacatePayBillingId: pixId, gymId: gymContext!.gymId },
		});
		if (gymSub) {
			const now = new Date();
			const periodEnd = new Date(now);
			const isAnnual = gymSub.billingPeriod === "annual";
			if (isAnnual) {
				periodEnd.setFullYear(periodEnd.getFullYear() + 1);
			} else {
				periodEnd.setMonth(periodEnd.getMonth() + 1);
			}
			await db.gymSubscription.update({
				where: { id: gymSub.id },
				data: {
					status: "active",
					currentPeriodStart: now,
					currentPeriodEnd: periodEnd,
					cancelAtPeriodEnd: false,
					canceledAt: null,
				},
			});
		}

		return NextResponse.json({ success: true, status: result.data.status });
	},
	{
		auth: "gym",
	},
);
