import { cancelSubscriptionHandler } from "@/lib/api/handlers/subscriptions.handler";
import type { NextRequest } from "@/runtime/next-server";

export async function POST(request: NextRequest) {
  return cancelSubscriptionHandler(request);
}
