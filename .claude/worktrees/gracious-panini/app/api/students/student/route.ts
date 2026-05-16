import type { NextRequest } from "next/server";
import { getStudentInfoHandler } from "@/lib/api/handlers/students.handler";

export async function GET(request: NextRequest) {
	return getStudentInfoHandler(request);
}
