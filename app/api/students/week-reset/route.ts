import type { NextRequest } from "next/server";
import { weekResetHandler } from "@/lib/api/handlers/students.handler";

export async function PATCH(request: NextRequest) {
	return weekResetHandler(request);
}
