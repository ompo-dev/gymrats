import { NextResponse } from "@/runtime/next-server";
import { updateStudentProgressSchema } from "@/lib/api/schemas/students.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { StudentDomainService } from "@/lib/services/student-domain.service";

export const GET = createSafeHandler(
  async ({ studentContext }) => {
    const { studentId } = studentContext!;
    const progress = await StudentDomainService.getProgress(studentId);
    return NextResponse.json(progress);
  },
  { auth: "student" },
);

export const PUT = createSafeHandler(
  async ({ body, studentContext }) => {
    const { studentId } = studentContext!;
    await StudentDomainService.updateProgress(studentId, body);
    return NextResponse.json({ message: "Progresso atualizado com sucesso" });
  },
  {
    auth: "student",
    schema: { body: updateStudentProgressSchema },
  },
);
