import { NextRequest } from "next/server";
import {
  getStudentProfileHandler,
  updateStudentProfileHandler,
} from "@/lib/api/handlers/students.handler";

export async function GET(request: NextRequest) {
  return getStudentProfileHandler(request);
}

export async function POST(request: NextRequest) {
  return updateStudentProfileHandler(request);
}
