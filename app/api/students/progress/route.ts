import { NextRequest } from "next/server";
import {
  getStudentProgressHandler,
  updateStudentProgressHandler,
} from "@/lib/api/handlers/students.handler";

export async function GET(request: NextRequest) {
  return getStudentProgressHandler(request);
}

export async function PUT(request: NextRequest) {
  return updateStudentProgressHandler(request);
}

