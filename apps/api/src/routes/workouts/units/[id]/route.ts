import {
  deleteUnitHandler,
  updateUnitHandler,
} from "@/lib/api/handlers/workout-management.handler";
import type { NextRequest } from "@/runtime/next-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return updateUnitHandler(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return deleteUnitHandler(request, { params });
}
