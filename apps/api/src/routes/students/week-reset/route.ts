import { weekResetHandler } from "@/lib/api/handlers/students.handler";
import type { NextRequest } from "@/runtime/next-server";

export async function PATCH(request: NextRequest) {
  return weekResetHandler(request);
}
