import type { NextRequest } from "next/server";
import { createSubscriptionHandler } from "@/lib/api/handlers/subscriptions.handler";

export async function POST(request: NextRequest) {
	return createSubscriptionHandler(request);
}
