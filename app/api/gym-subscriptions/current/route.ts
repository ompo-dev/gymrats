import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { getTimeMs } from "@/lib/utils/date-safe";

export const GET = createSafeHandler(
	async ({ gymContext }) => {
		const gymId = gymContext!.gymId;
		const subscription = await db.gymSubscription.findUnique({ where: { gymId } });

		if (
			!subscription ||
			(subscription.status === "canceled" &&
				(!subscription.trialEnd || (getTimeMs(subscription.trialEnd) ?? 0) < Date.now()))
		) {
			return NextResponse.json({ subscription: null });
		}

		const activeStudents = await db.gymMembership.count({
			where: { gymId, status: "active" },
		});

		const trialEndMs = getTimeMs(subscription.trialEnd);
		const isTrial = !!subscription.trialEnd && (trialEndMs ?? 0) > Date.now();
		const daysRemaining = trialEndMs != null
			? Math.max(0, Math.ceil((trialEndMs - Date.now()) / (1000 * 3600 * 24)))
			: null;

		return NextResponse.json({
			subscription: {
				...subscription,
				billingPeriod: subscription.billingPeriod ?? "monthly",
				isTrial,
				daysRemaining,
				activeStudents,
				totalAmount:
					subscription.billingPeriod === "annual"
						? subscription.basePrice
						: subscription.basePrice +
							subscription.pricePerStudent * activeStudents,
			},
		});
	},
	{
		auth: "gym",
	},
);
