import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { GymSubscriptionService } from "@/lib/services/gym/gym-subscription.service";

export const GET = createSafeHandler(
	async ({ gymContext }) => {
		const userId = gymContext!.user.id;

		// Sincronizar isActive: com Premium/Enterprise todas as academias ficam ativas
		await GymSubscriptionService.enforceActiveGymLimit(userId);

		const gyms = await db.gym.findMany({
			where: { userId },
			include: { subscription: true },
			orderBy: { createdAt: "asc" },
		});

		const hasQualifiedSubscription = gyms.some(
			(gym) =>
				gym.subscription?.status === "active" &&
				(gym.subscription.plan.toLowerCase().includes("premium") ||
					gym.subscription.plan.toLowerCase().includes("enterprise")),
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
				phone: gym.phone ?? "",
				cnpj: gym.cnpj ?? undefined,
				plan: (gym.subscription?.plan ?? gym.plan) as "basic" | "premium" | "enterprise",
				isActive: gym.isActive,
				hasActiveSubscription: gymHasActiveSubscription,
			};
		});

		return NextResponse.json({
			gyms: gymsData,
			canCreateMultipleGyms: hasQualifiedSubscription,
			totalGyms: gyms.length,
			activeGymId: gymContext!.user.activeGymId ?? null,
		});
	},
	{ auth: "gym" },
);
