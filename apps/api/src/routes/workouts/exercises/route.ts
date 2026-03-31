import { createExerciseHandler } from "@/lib/api/handlers/workout-management.handler";
import type { NextRequest } from "@/runtime/next-server";

export async function POST(request: NextRequest) {
  return createExerciseHandler(request);
}
