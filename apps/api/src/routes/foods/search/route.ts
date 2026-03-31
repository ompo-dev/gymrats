import { searchFoodsHandler } from "@/lib/api/handlers/nutrition.handler";
import type { NextRequest } from "@/runtime/next-server";

export async function GET(request: NextRequest) {
  return searchFoodsHandler(request);
}
