import { getFoodByIdHandler } from "@/lib/api/handlers/nutrition.handler";
import type { NextRequest } from "@/runtime/next-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await Promise.resolve(params);
  return getFoodByIdHandler(request, resolvedParams.id);
}
