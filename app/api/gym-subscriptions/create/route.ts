import { NextRequest } from "next/server";
import { createGymSubscriptionHandler } from "@/lib/api/handlers/gym-subscriptions.handler";

export async function POST(request: NextRequest) {
  return createGymSubscriptionHandler(request);
}
