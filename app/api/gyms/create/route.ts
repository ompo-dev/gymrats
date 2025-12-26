import { NextRequest } from "next/server";
import { createGymHandler } from "@/lib/api/handlers/gyms.handler";

export async function POST(request: NextRequest) {
  return createGymHandler(request);
}
