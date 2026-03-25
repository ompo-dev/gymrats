import { createUnitHandler } from "@/lib/api/handlers/workout-management.handler";
import { getUnitsHandler } from "@/lib/api/handlers/workouts.handler";
import type { NextRequest } from "@/runtime/next-server";

export async function GET(request: NextRequest) {
  return getUnitsHandler(request);
}

export async function POST(request: NextRequest) {
  return createUnitHandler(request);
}
