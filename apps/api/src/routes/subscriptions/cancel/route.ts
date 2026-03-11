import type { NextRequest } from "@/runtime/next-server";
import { cancelSubscriptionHandler } from "@/lib/api/handlers/subscriptions.handler";

export async function POST(request: NextRequest) {
  return cancelSubscriptionHandler(request);
}
