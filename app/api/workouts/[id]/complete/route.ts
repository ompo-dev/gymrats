import { NextRequest } from "next/server";
import { completeWorkoutHandler } from "@/lib/api/handlers/workouts.handler";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  return completeWorkoutHandler(request, resolvedParams.id);
}
