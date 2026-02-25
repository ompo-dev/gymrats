import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

export const POST = createSafeHandler(
	async ({ gymContext }) => {
		const gymId = gymContext!.gymId;
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

		return NextResponse.json({
			message: "Assinatura cancelada com sucesso",
		});
	},
	{
		auth: "gym",
	},
);
