import type { NextRequest } from "next/server";
import { startTrialHandler } from "@/lib/api/handlers/subscriptions.handler";

export async function POST(request: NextRequest) {
	return startTrialHandler(request);
}
