import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { GymSubscriptionService } from "@/lib/services/gym/gym-subscription.service";

export const POST = createSafeHandler(
	async ({ gymContext }) => {
		const gymId = gymContext!.gymId;
		const userId = gymContext!.userId;
		const subscription = await db.gymSubscription.findUnique({
			where: { gymId },
		});

		if (!subscription) {
			return NextResponse.json(
				{ error: "Assinatura não encontrada" },
				{ status: 404 },
			);
		}

		await db.gymSubscription.update({
			where: { id: subscription.id },
			data: {
				status: "canceled",
				canceledAt: new Date(),
				cancelAtPeriodEnd: false,
			},
		});

		// Aplicar regras de multi-gym (downgrade/cancelamento)
		await GymSubscriptionService.handleGymDowngrade(gymId);

		return NextResponse.json({
			message: "Assinatura cancelada com sucesso",
		});
	},
	{
		auth: "gym",
	},
);
