import type { NextRequest } from "@/runtime/next-server";
import { getCurrentSubscriptionHandler } from "@/lib/api/handlers/subscriptions.handler";

export async function GET(request: NextRequest) {
  return getCurrentSubscriptionHandler(request);
}
