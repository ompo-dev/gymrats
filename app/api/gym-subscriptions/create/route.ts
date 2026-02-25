import { NextResponse } from "next/server";
import { createGymSubscriptionSchema } from "@/lib/api/schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { createGymSubscriptionPix } from "@/lib/utils/subscription";

export const POST = createSafeHandler(
	async ({ gymContext, body }) => {
		const gymId = gymContext!.gymId;
		const { plan = "basic", billingPeriod = "monthly" } = body;

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

		const planPrices = {
			basic: { base: 150, perStudent: 1.5 },
			premium: { base: 250, perStudent: 1 },
			enterprise: { base: 400, perStudent: 0.5 },
		};
		const annualDiscounts = { basic: 0.95, premium: 0.9, enterprise: 0.85 };
		const prices = planPrices[plan];

		const basePrice =
			billingPeriod === "annual"
				? Math.round(prices.base * 12 * annualDiscounts[plan])
				: prices.base;
		const pricePerStudent = billingPeriod === "annual" ? 0 : prices.perStudent;

		let subscriptionId = existingSubscription?.id;

		if (existingSubscription) {
			await db.gymSubscription.update({
				where: { id: existingSubscription.id },
				data: {
					plan,
					billingPeriod,
					status: "pending",
					basePrice,
					pricePerStudent,
					currentPeriodStart: now,
					currentPeriodEnd: periodEnd,
					trialStart: null,
					trialEnd: null,
					canceledAt: null,
					cancelAtPeriodEnd: false,
				},
			});
		} else {
			const created = await db.gymSubscription.create({
				data: {
					gymId,
					plan,
					billingPeriod,
					status: "pending",
					basePrice,
					pricePerStudent,
					currentPeriodStart: now,
					currentPeriodEnd: periodEnd,
				},
			});
			subscriptionId = created.id;
		}

		const pix = await createGymSubscriptionPix(
			gymId,
			plan,
			activeStudents,
			billingPeriod,
			subscriptionId!,
		);

		if (!pix || !pix.id) {
			return NextResponse.json(
				{ error: "Erro ao criar PIX: resposta inválida da AbacatePay" },
				{ status: 500 },
			);
		}

		if (subscriptionId) {
			await db.gymSubscription.update({
				where: { id: subscriptionId },
				data: { abacatePayBillingId: pix.id },
			});
		}

		return NextResponse.json({
			pixId: pix.id,
			brCode: pix.brCode,
			brCodeBase64: pix.brCodeBase64,
			amount: pix.amount,
		});
	},
	{
		auth: "gym",
		schema: { body: createGymSubscriptionSchema },
	},
);
