import type { NextRequest } from "@/runtime/next-server";
import { getFriendsHandler } from "@/lib/api/handlers/students.handler";

export async function GET(request: NextRequest) {
  return getFriendsHandler(request);
}
