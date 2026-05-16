import type { NextRequest } from "next/server";
import { getMembershipsHandler } from "@/lib/api/handlers/payments.handler";

export async function GET(request: NextRequest) {
	return getMembershipsHandler(request);
}
