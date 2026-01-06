
import { NextRequest } from "next/server";
import { updateExerciseHandler, deleteExerciseHandler } from "@/lib/api/handlers/workout-management.handler";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return updateExerciseHandler(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return deleteExerciseHandler(request, { params });
}
