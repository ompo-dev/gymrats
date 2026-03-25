import { getCurrentSubscriptionHandler } from "@/lib/api/handlers/subscriptions.handler";
import type { NextRequest } from "@/runtime/next-server";

export async function GET(request: NextRequest) {
  return getCurrentSubscriptionHandler(request);
}
