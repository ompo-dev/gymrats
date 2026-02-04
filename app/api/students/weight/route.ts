import type { NextRequest } from "next/server";
import {
	addWeightHandler,
	getWeightHistoryHandler,
} from "@/lib/api/handlers/students.handler";

export async function GET(request: NextRequest) {
	return getWeightHistoryHandler(request);
}

export async function POST(request: NextRequest) {
	return addWeightHandler(request);
}
