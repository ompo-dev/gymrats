import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { getTimeMs } from "@/lib/utils/date-safe";

export const GET = createSafeHandler(
	async ({ gymContext }) => {
		const gymId = gymContext!.gymId;
		const subscription = await db.gymSubscription.findUnique({ where: { gymId } });

		if (!subscription) {
			return NextResponse.json({ subscription: null, canStartTrial: true });
		}

		// Se expirou trial ou cancelado, ainda assim retornamos o objeto para o frontend saber o histórico (ex.: canStartTrial: false)
		const isCanceledAndExpired = 
			subscription.status === "canceled" &&
			(!subscription.trialEnd || (getTimeMs(subscription.trialEnd) ?? 0) < Date.now());

		const activeStudents = await db.gymMembership.count({
			where: { gymId, status: "active" },
		});

		const trialEndMs = getTimeMs(subscription.trialEnd);
		const isTrial = !!subscription.trialEnd && (trialEndMs ?? 0) > Date.now();
		const daysRemaining = trialEndMs != null
			? Math.max(0, Math.ceil((trialEndMs - Date.now()) / (1000 * 3600 * 24)))
			: null;

		// totalAmount: anual usa valor anual (base mensal × 12 × desconto), mensal usa base + por aluno
		const planMonthlyBases: Record<string, number> = {
			basic: 150,
			premium: 250,
			enterprise: 400,
		};
		const annualDiscounts: Record<string, number> = {
			basic: 0.95,
			premium: 0.9,
			enterprise: 0.85,
		};
		const monthlyBase = planMonthlyBases[subscription.plan] ?? subscription.basePrice;
		const totalAmount =
			subscription.billingPeriod === "annual"
				? Math.round(
						monthlyBase *
							12 *
							(annualDiscounts[subscription.plan] ?? 0.9),
					)
				: subscription.basePrice +
					subscription.pricePerStudent * activeStudents;

		return NextResponse.json({
			subscription: {
				...subscription,
				billingPeriod: subscription.billingPeriod ?? "monthly",
				isTrial,
				daysRemaining,
				activeStudents,
				totalAmount,
				canStartTrial: false,
			},
		});
	},
	{
		auth: "gym",
	},
);
