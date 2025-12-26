import { NextRequest } from "next/server";
import { getWeightHistoryFilteredHandler } from "@/lib/api/handlers/students.handler";

export async function GET(request: NextRequest) {
  return getWeightHistoryFilteredHandler(request);
}
