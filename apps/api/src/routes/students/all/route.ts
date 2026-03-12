/**
 * API Unificada para Student
 *
 * Esta API retorna todos os dados do student de uma vez,
 * ou apenas as seções solicitadas via query params.
 *
 * GET /api/students/all
 * GET /api/students/all?sections=progress,profile,workouts
 */

import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import {
  buildStudentBootstrap,
  parseStudentBootstrapSections,
} from "@/lib/bootstrap/student-bootstrap";

export const GET = createSafeHandler(
  async ({ query, studentContext }) => {
    const response = await buildStudentBootstrap({
      studentId: studentContext!.studentId,
      userId: String(studentContext!.user.id),
      sections: parseStudentBootstrapSections(query.sections as string | undefined),
    });
    return NextResponse.json(response.data);
  },
  { auth: "student" },
);
