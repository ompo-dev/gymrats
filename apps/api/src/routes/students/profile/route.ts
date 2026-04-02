import { updateStudentProfileSchema } from "@/lib/api/schemas/students.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { StudentDomainService } from "@/lib/services/student-domain.service";
import { parseJsonArray, parseJsonSafe } from "@/lib/utils/json";
import { NextResponse } from "@/runtime/next-server";

export const GET = createSafeHandler(
  async ({ studentContext }) => {
    const { studentId } = studentContext!;

    const user = await db.user.findFirst({
      where: { student: { id: studentId } },
      include: {
        student: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!user || !user.student) {
      return NextResponse.json({ hasProfile: false });
    }

    const hasProfile =
      !!user.student.profile &&
      user.student.profile.height !== null &&
      user.student.profile.weight !== null &&
      user.student.profile.fitnessLevel !== null;

    return NextResponse.json({
      hasProfile,
      student: {
        id: user.student.id,
        age: user.student.age,
        gender: user.student.gender,
        isTrans: user.student.isTrans ?? false,
        usesHormones: user.student.usesHormones ?? false,
        hormoneType: user.student.hormoneType || null,
      },
      profile: user.student.profile
        ? {
            ...user.student.profile,
            goals: parseJsonArray<string>(user.student.profile.goals),
            availableEquipment: parseJsonArray<string>(
              user.student.profile.availableEquipment,
            ),
            physicalLimitations: parseJsonArray<string>(
              user.student.profile.physicalLimitations,
            ),
            motorLimitations: parseJsonArray<string>(
              user.student.profile.motorLimitations,
            ),
            medicalConditions: parseJsonArray<string>(
              user.student.profile.medicalConditions,
            ),
            limitationDetails: parseJsonSafe<Record<string, unknown>>(
              user.student.profile.limitationDetails,
            ),
            injuries: parseJsonArray<string>(user.student.profile.injuries),
          }
        : null,
    });
  },
  { auth: "student" },
);

export const POST = createSafeHandler(
  async ({ body, studentContext }) => {
    const { studentId } = studentContext!;
    await StudentDomainService.updateFullProfile(
      studentId,
      body as Parameters<typeof StudentDomainService.updateFullProfile>[1],
    );
    return NextResponse.json({ message: "Perfil salvo com sucesso" });
  },
  {
    auth: "student",
    schema: { body: updateStudentProfileSchema },
  },
);
