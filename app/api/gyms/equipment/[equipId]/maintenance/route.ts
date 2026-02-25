import { NextResponse } from "next/server";
import {
	createGymMaintenanceSchema,
	gymEquipmentIdParamsSchema,
} from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";

export const POST = createSafeHandler(
	async ({ gymContext, params, body }) => {
		const record = await GymDomainService.createEquipmentMaintenance(
			gymContext!.gymId,
			params.equipId,
			body,
		);
		return NextResponse.json({ record }, { status: 201 });
	},
	{
		auth: "gym",
		schema: {
			params: gymEquipmentIdParamsSchema,
			body: createGymMaintenanceSchema,
		},
	},
);
