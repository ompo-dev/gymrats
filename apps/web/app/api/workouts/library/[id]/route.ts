import type { NextRequest } from "next/server";
import {
  deleteLibraryPlanHandler,
  updateLibraryPlanHandler,
} from "@/lib/api/handlers/training-library.handler";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return updateLibraryPlanHandler(request, { params });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return updateLibraryPlanHandler(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return deleteLibraryPlanHandler(request, { params });
}
