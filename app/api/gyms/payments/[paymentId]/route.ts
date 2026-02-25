import { NextResponse } from "next/server";
import {
	gymPaymentIdParamsSchema,
	updateGymPaymentStatusSchema,
} from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";

export const PATCH = createSafeHandler(
	async ({ gymContext, params, body }) => {
		const payment = await GymDomainService.updatePaymentStatus(
			gymContext!.gymId,
			params.paymentId,
			body.status,
		);
		return NextResponse.json({ payment });
	},
	{
		auth: "gym",
		schema: {
			params: gymPaymentIdParamsSchema,
			body: updateGymPaymentStatusSchema,
		},
	},
);
