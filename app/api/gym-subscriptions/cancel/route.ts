import { NextRequest } from "next/server";
import { cancelGymSubscriptionHandler } from "@/lib/api/handlers/gym-subscriptions.handler";

export async function POST(request: NextRequest) {
  return cancelGymSubscriptionHandler(request);
}
