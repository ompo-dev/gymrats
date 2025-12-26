import { NextRequest } from "next/server";
import { getStudentProgressHandler } from "@/lib/api/handlers/students.handler";

export async function GET(request: NextRequest) {
  return getStudentProgressHandler(request);
}

