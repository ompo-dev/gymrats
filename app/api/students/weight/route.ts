import { NextRequest } from "next/server";
import {
  getWeightHistoryHandler,
  addWeightHandler,
} from "@/lib/api/handlers/students.handler";

export async function GET(request: NextRequest) {
  return getWeightHistoryHandler(request);
}

export async function POST(request: NextRequest) {
  return addWeightHandler(request);
}
