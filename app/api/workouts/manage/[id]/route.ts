
import { NextRequest } from "next/server";
import { updateWorkoutHandler, deleteWorkoutHandler } from "@/lib/api/handlers/workout-management.handler";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return updateWorkoutHandler(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return deleteWorkoutHandler(request, { params });
}
