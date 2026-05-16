import type { NextRequest } from "next/server";
import { getDayPassesHandler } from "@/lib/api/handlers/students.handler";

export async function GET(request: NextRequest) {
	return getDayPassesHandler(request);
}
