import { NextResponse } from "@/runtime/next-server";
import { getSwaggerSpec } from "@/lib/api/swagger-spec";

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:4000";
  const swaggerSpec = getSwaggerSpec(baseUrl);
  return NextResponse.json(swaggerSpec);
}
