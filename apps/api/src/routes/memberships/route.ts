import { getMembershipsHandler } from "@/lib/api/handlers/payments.handler";
import type { NextRequest } from "@/runtime/next-server";

export async function GET(request: NextRequest) {
  return getMembershipsHandler(request);
}
