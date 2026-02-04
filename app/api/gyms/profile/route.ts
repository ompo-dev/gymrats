import type { NextRequest } from "next/server";
import { getGymProfileHandler } from "@/lib/api/handlers/gyms.handler";

export async function GET(request: NextRequest) {
	return getGymProfileHandler(request);
}
