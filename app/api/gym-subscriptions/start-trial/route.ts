import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

export const POST = createSafeHandler(
	async ({ gymContext }) => {
		const gymId = gymContext!.gymId;
		const existingSubscription = await db.gymSubscription.findUnique({
			where: { gymId },
		});

		if (existingSubscription) {
			if (existingSubscription.status === "canceled") {
				await db.gymSubscription.delete({ where: { id: existingSubscription.id } });
			} else {
				return NextResponse.json(
					{ error: "Assinatura já existe" },
					{ status: 400 },
				);
			}
		}

		const now = new Date();
		const trialEnd = new Date(now);
		trialEnd.setDate(trialEnd.getDate() + 14);

		const subscription = await db.gymSubscription.create({
			data: {
				gymId,
				plan: "basic",
				billingPeriod: "monthly",
				status: "trialing",
				basePrice: 150,
				pricePerStudent: 1.5,
				currentPeriodStart: now,
				currentPeriodEnd: trialEnd,
				trialStart: now,
				trialEnd,
			},
		});

		return NextResponse.json({ success: true, subscription });
	},
	{
		auth: "gym",
	},
);
