import { NextRequest } from "next/server";
import { getUnitsHandler } from "@/lib/api/handlers/workouts.handler";

export async function GET(request: NextRequest) {
  return getUnitsHandler(request);
}
