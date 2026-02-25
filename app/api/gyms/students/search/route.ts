import { NextResponse } from "next/server";
import { gymStudentsSearchQuerySchema } from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";

export const GET = createSafeHandler(
	async ({ gymContext, query }) => {
		const result = await GymDomainService.searchStudentByEmail(
			gymContext!.gymId,
			query.email,
		);
		return NextResponse.json(result);
	},
	{
		auth: "gym",
		schema: { query: gymStudentsSearchQuerySchema },
	},
);
