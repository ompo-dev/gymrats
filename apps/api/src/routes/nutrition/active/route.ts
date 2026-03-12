import type { NextRequest } from "@/runtime/next-server";
import { getActiveNutritionPlanHandler } from "@/lib/api/handlers/nutrition.handler";

export async function GET(request: NextRequest) {
  return getActiveNutritionPlanHandler(request);
}
