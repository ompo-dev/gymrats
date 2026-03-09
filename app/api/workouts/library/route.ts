import type { NextRequest } from "next/server";
import {
  getLibraryPlansHandler,
  createLibraryPlanHandler,
} from "@/lib/api/handlers/training-library.handler";

export async function GET(request: NextRequest) {
  return getLibraryPlansHandler(request);
}

export async function POST(request: NextRequest) {
  return createLibraryPlanHandler(request);
}
