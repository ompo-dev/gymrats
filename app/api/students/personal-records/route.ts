import { NextRequest } from "next/server";
import { getPersonalRecordsHandler } from "@/lib/api/handlers/students.handler";

export async function GET(request: NextRequest) {
  return getPersonalRecordsHandler(request);
}

