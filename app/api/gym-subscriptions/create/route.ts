import { NextResponse } from "next/server";
import { createGymSubscriptionSchema } from "@/lib/api/schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { createGymSubscriptionBilling } from "@/lib/utils/subscription";

export const POST = createSafeHandler(
	async ({ gymContext, body }) => {
		const gymId = gymContext!.gymId;
		const { billingPeriod = "monthly" } = body;

		const activeStudents = await db.gymMembership.count({
			where: { gymId, status: "active" },
		});

		const existingSubscription = await db.gymSubscription.findUnique({
			where: { gymId },
		});

		const now = new Date();
		const periodEnd = new Date(now);
		if (billingPeriod === "annual") {
			periodEnd.setFullYear(periodEnd.getFullYear() + 1);
		} else {
			periodEnd.setMonth(periodEnd.getMonth() + 1);
		}

		const plan = "basic";
		const planPrices = {
			basic: { base: 150, perStudent: 1.5 },
			premium: { base: 250, perStudent: 1 },
			enterprise: { base: 400, perStudent: 0.5 },
		};
		const prices = planPrices[plan];

		if (existingSubscription) {
			await db.gymSubscription.update({
				where: { id: existingSubscription.id },
				data: {
					plan,
					billingPeriod,
					status: "active",
					basePrice: prices.base,
					pricePerStudent: billingPeriod === "annual" ? 0 : prices.perStudent,
					currentPeriodStart: now,
					currentPeriodEnd: periodEnd,
					trialStart: null,
					trialEnd: null,
					canceledAt: null,
					cancelAtPeriodEnd: false,
				},
			});
		}

		const billing = await createGymSubscriptionBilling(
			gymId,
			plan,
			activeStudents,
			billingPeriod,
		);

		if (!billing || !billing.id) {
			return NextResponse.json(
				{ error: "Erro ao criar cobrança: resposta inválida da AbacatePay" },
				{ status: 500 },
			);
		}

		if (existingSubscription) {
			await db.gymSubscription.update({
				where: { id: existingSubscription.id },
				data: { abacatePayBillingId: billing.id },
			});
		}

		return NextResponse.json({
			billingUrl: String(billing.url || ""),
			billingId: String(billing.id || ""),
		});
	},
	{
		auth: "gym",
		schema: { body: createGymSubscriptionSchema },
	},
);
