import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

export const GET = createSafeHandler(
	async ({ gymContext }) => {
		const userId = gymContext!.user.id;
		const gyms = await db.gym.findMany({
			where: { userId },
			include: { subscription: true },
			orderBy: { createdAt: "asc" },
		});

		const hasPaidSubscription = gyms.some(
			(gym) => gym.subscription?.status === "active",
		);

		const gymsData = gyms.map((gym) => {
			const now = new Date();
			const gymHasActiveSubscription = gym.subscription
				? gym.subscription.status === "active" ||
					(gym.subscription.status === "trialing" &&
						!!gym.subscription.trialEnd &&
						new Date(gym.subscription.trialEnd) > now)
				: false;

			return {
				id: gym.id,
				name: gym.name,
				logo: gym.logo,
				address: gym.address,
				email: gym.email,
				plan: gym.plan,
				isActive: gym.isActive,
				hasActiveSubscription: gymHasActiveSubscription,
			};
		});

		return NextResponse.json({
			gyms: gymsData,
			canCreateMultipleGyms: hasPaidSubscription,
			totalGyms: gyms.length,
		});
	},
	{ auth: "gym" },
);
