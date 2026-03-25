import {
  createLibraryPlanHandler,
  getLibraryPlansHandler,
} from "@/lib/api/handlers/training-library.handler";
import type { NextRequest } from "@/runtime/next-server";

export async function GET(request: NextRequest) {
  return getLibraryPlansHandler(request);
}

export async function POST(request: NextRequest) {
  return createLibraryPlanHandler(request);
}
