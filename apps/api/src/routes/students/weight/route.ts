import {
  addWeightHandler,
  getWeightHistoryHandler,
} from "@/lib/api/handlers/students.handler";
import type { NextRequest } from "@/runtime/next-server";

export async function GET(request: NextRequest) {
  return getWeightHistoryHandler(request);
}

export async function POST(request: NextRequest) {
  return addWeightHandler(request);
}
