import type { NextRequest } from "next/server";
import { activateLibraryPlanHandler } from "@/lib/api/handlers/training-library.handler";

export async function POST(request: NextRequest) {
  return activateLibraryPlanHandler(request);
}
