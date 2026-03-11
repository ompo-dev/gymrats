import type { NextRequest } from "@/runtime/next-server";
import { getWorkoutHistoryHandler } from "@/lib/api/handlers/workouts.handler";

export async function GET(request: NextRequest) {
  return getWorkoutHistoryHandler(request);
}
