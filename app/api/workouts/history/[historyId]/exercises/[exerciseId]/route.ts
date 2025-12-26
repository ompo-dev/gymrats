import { NextRequest } from "next/server";
import { updateExerciseLogHandler } from "@/lib/api/handlers/workouts.handler";

export async function PUT(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ historyId: string; exerciseId: string }> | { historyId: string; exerciseId: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  return updateExerciseLogHandler(
    request,
    resolvedParams.historyId,
    resolvedParams.exerciseId
  );
}

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ historyId: string; exerciseId: string }> | { historyId: string; exerciseId: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  return updateExerciseLogHandler(
    request,
    resolvedParams.historyId,
    resolvedParams.exerciseId
  );
}

