import { NextRequest } from "next/server";
import { listGymsHandler } from "@/lib/api/handlers/gyms.handler";

export async function GET(request: NextRequest) {
  return listGymsHandler(request);
}
