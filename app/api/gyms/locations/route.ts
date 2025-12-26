import { NextRequest } from "next/server";
import { getGymLocationsHandler } from "@/lib/api/handlers/gyms.handler";

export async function GET(request: NextRequest) {
  return getGymLocationsHandler(request);
}
