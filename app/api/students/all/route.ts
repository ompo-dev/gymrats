/**
 * API Unificada para Student
 * 
 * Esta API retorna todos os dados do student de uma vez,
 * ou apenas as seções solicitadas via query params.
 * 
 * GET /api/students/all
 * GET /api/students/all?sections=progress,profile,workouts
 */

import { NextRequest } from "next/server";
import { getAllStudentDataHandler } from "@/lib/api/handlers/students.handler";

export async function GET(request: NextRequest) {
  return getAllStudentDataHandler(request);
}

