import type { NextRequest } from "next/server";
import { startGymTrialHandler } from "@/lib/api/handlers/gym-subscriptions.handler";

export async function POST(request: NextRequest) {
	return startGymTrialHandler(request);
}
