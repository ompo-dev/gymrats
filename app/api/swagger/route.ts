import { NextResponse } from "next/server";
import { getSwaggerSpec } from "@/lib/api/swagger-spec";

export async function GET() {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
	const swaggerSpec = getSwaggerSpec(baseUrl);
	return NextResponse.json(swaggerSpec);
}
