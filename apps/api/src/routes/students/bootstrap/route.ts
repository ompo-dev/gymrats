import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import {
  buildStudentBootstrap,
  parseStudentBootstrapSections,
} from "@/lib/bootstrap/student-bootstrap";

export const GET = createSafeHandler(
  async ({ query, studentContext }) => {
    const sections = parseStudentBootstrapSections(query.sections as string | undefined);
    const response = await buildStudentBootstrap({
      studentId: studentContext!.studentId,
      userId: String(studentContext!.user.id),
      sections,
    });

    return NextResponse.json(response);
  },
  { auth: "student" },
);
