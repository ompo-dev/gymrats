import { NextRequest } from "next/server";
import { getUnitsHandler } from "@/lib/api/handlers/workouts.handler";
import { createUnitHandler } from "@/lib/api/handlers/workout-management.handler";

export async function GET(request: NextRequest) {
  return getUnitsHandler(request);
}

export async function POST(request: NextRequest) {
  return createUnitHandler(request);
}
