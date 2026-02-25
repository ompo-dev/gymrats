import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

export const GET = createSafeHandler(
	async ({ gymContext }) => {
		const gymId = gymContext!.gymId;
		const subscription = await db.gymSubscription.findUnique({ where: { gymId } });

		if (
			!subscription ||
			(subscription.status === "canceled" &&
				(!subscription.trialEnd || new Date() > subscription.trialEnd))
		) {
			return NextResponse.json({ subscription: null });
		}

		const activeStudents = await db.gymMembership.count({
			where: { gymId, status: "active" },
		});

		return NextResponse.json({
			subscription: {
				...subscription,
				isTrial: subscription.trialEnd ? new Date() < subscription.trialEnd : false,
				daysRemaining: subscription.trialEnd
					? Math.max(
							0,
							Math.ceil(
								(subscription.trialEnd.getTime() - Date.now()) / (1000 * 3600 * 24),
							),
						)
					: null,
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
