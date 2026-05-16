import type { NextRequest } from "next/server";
import { createWorkoutHandler } from "@/lib/api/handlers/workout-management.handler";

export async function POST(request: NextRequest) {
	return createWorkoutHandler(request);
}
