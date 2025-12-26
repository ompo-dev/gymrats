import { NextRequest } from "next/server";
import { setActiveGymHandler } from "@/lib/api/handlers/gyms.handler";

export async function POST(request: NextRequest) {
  return setActiveGymHandler(request);
}
