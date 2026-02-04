import type { NextRequest } from "next/server";
import { getCurrentGymSubscriptionHandler } from "@/lib/api/handlers/gym-subscriptions.handler";

export async function GET(request: NextRequest) {
	return getCurrentGymSubscriptionHandler(request);
}
