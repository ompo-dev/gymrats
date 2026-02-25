import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymInventoryService } from "@/lib/services/gym/gym-inventory.service";

export const GET = createSafeHandler(
	async ({ gymContext }) => {
		const profile = await GymInventoryService.getProfile(gymContext!.gymId);
		return NextResponse.json({
			hasProfile: !!profile,
			profile,
		});
	},
	{ auth: "gym" },
);
