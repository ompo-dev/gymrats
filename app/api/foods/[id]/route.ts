import { NextRequest } from "next/server";
import { getFoodByIdHandler } from "@/lib/api/handlers/nutrition.handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  return getFoodByIdHandler(request, resolvedParams.id);
}
