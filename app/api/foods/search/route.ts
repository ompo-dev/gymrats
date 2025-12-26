import { NextRequest } from "next/server";
import { searchFoodsHandler } from "@/lib/api/handlers/nutrition.handler";

export async function GET(request: NextRequest) {
  return searchFoodsHandler(request);
}
