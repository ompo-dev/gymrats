import { getPersonalRecordsHandler } from "@/lib/api/handlers/students.handler";
import type { NextRequest } from "@/runtime/next-server";

export async function GET(request: NextRequest) {
  return getPersonalRecordsHandler(request);
}
