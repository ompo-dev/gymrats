import { updateWorkoutProgressExerciseHandler } from "@/lib/api/handlers/workouts.handler";
import type { NextRequest } from "@/runtime/next-server";

export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params:
      | Promise<{ id: string; exerciseId: string }>
      | { id: string; exerciseId: string };
  },
) {
  const resolvedParams = await Promise.resolve(params);
  return updateWorkoutProgressExerciseHandler(
    request,
    resolvedParams.id,
    resolvedParams.exerciseId,
  );
}

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params:
      | Promise<{ id: string; exerciseId: string }>
      | { id: string; exerciseId: string };
  },
) {
  const resolvedParams = await Promise.resolve(params);
  return updateWorkoutProgressExerciseHandler(
    request,
    resolvedParams.id,
    resolvedParams.exerciseId,
  );
}
