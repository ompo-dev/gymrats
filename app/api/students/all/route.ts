/**
 * API Unificada para Student
 *
 * Esta API retorna todos os dados do student de uma vez,
 * ou apenas as seções solicitadas via query params.
 *
 * GET /api/students/all
 * GET /api/students/all?sections=progress,profile,workouts
 */

import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { StudentDomainService } from "@/lib/services/student-domain.service";

export const GET = createSafeHandler(
  async ({ query, studentContext }) => {
    const { studentId, user } = studentContext!;
    const userId = user.id;
    const sectionsParam = query.sections as string | undefined;
    const sections = sectionsParam ? sectionsParam.split(",") : undefined;
    
    const data = await StudentDomainService.getAllData(studentId, userId, sections);
    return NextResponse.json(data);
  },
  { auth: "student" }
);
