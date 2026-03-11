import type { NextRequest } from "@/runtime/next-server";
import {
  createWeeklyPlanHandler,
  updateWeeklyPlanHandler,
} from "@/lib/api/handlers/workout-management.handler";
import { getWeeklyPlanHandler } from "@/lib/api/handlers/workouts.handler";

export async function GET(request: NextRequest) {
  return getWeeklyPlanHandler(request);
}

export async function POST(request: NextRequest) {
  return createWeeklyPlanHandler(request);
}

export async function PATCH(request: NextRequest) {
  return updateWeeklyPlanHandler(request);
}
