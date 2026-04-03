import type { StudentProfileData } from "@gymrats/types";
import { requireAuth } from "@/lib/api/middleware/auth.middleware";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { sendWelcomeEmail } from "@/lib/services/email.service";
import { StudentProfileService } from "@/lib/services/student/student-profile.service";
import { ensureStudentRole } from "@/lib/utils/ensure-user-role";
import { type NextRequest, NextResponse } from "@/runtime/next-server";

type StudentOnboardingBody = {
  age?: number | "";
  gender?: string;
  isTrans?: boolean;
  usesHormones?: boolean;
  hormoneType?: string;
  height?: number | "";
  weight?: number | "";
  fitnessLevel?: string;
  weeklyWorkoutFrequency?: number;
  workoutDuration?: number;
  goals?: string[];
  gymType?: string;
  preferredSets?: number;
  preferredRepRange?: string;
  restTime?: string;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFats?: number;
  activityLevel?: number;
  hormoneTreatmentDuration?: number;
  physicalLimitations?: string[];
  motorLimitations?: string[];
  medicalConditions?: string[];
};

const ONBOARDING_DEFAULTS = {
  gymType: "academia-completa",
  preferredSets: 3,
  preferredRepRange: "hipertrofia",
  restTime: "medio",
} as const;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return auth.response;
    }

    if (auth.user.role !== "PENDING" && auth.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Fluxo invalido" }, { status: 400 });
    }

    const body = (await request.json()) as StudentOnboardingBody;
    const normalizedData = {
      ...body,
      gymType: body.gymType || ONBOARDING_DEFAULTS.gymType,
      preferredSets: body.preferredSets ?? ONBOARDING_DEFAULTS.preferredSets,
      preferredRepRange:
        body.preferredRepRange || ONBOARDING_DEFAULTS.preferredRepRange,
      restTime: body.restTime || ONBOARDING_DEFAULTS.restTime,
      goals: Array.isArray(body.goals) ? body.goals : [],
      physicalLimitations: Array.isArray(body.physicalLimitations)
        ? body.physicalLimitations
        : [],
      motorLimitations: Array.isArray(body.motorLimitations)
        ? body.motorLimitations
        : [],
      medicalConditions: Array.isArray(body.medicalConditions)
        ? body.medicalConditions
        : [],
    };

    let studentId = auth.user.student?.id as string | undefined;
    if (!studentId) {
      const ensure = await ensureStudentRole(auth.userId);
      if (!ensure.ok || !ensure.studentId) {
        return NextResponse.json(
          { error: ensure.ok ? "Erro ao criar aluno" : ensure.error },
          { status: 400 },
        );
      }

      studentId = ensure.studentId;
    }

    const studentData = {
      age: typeof normalizedData.age === "number" ? normalizedData.age : null,
      gender:
        typeof normalizedData.gender === "string" &&
        normalizedData.gender.length > 0
          ? normalizedData.gender
          : null,
      isTrans: Boolean(normalizedData.isTrans),
      usesHormones: Boolean(normalizedData.usesHormones),
      hormoneType:
        typeof normalizedData.hormoneType === "string" &&
        normalizedData.hormoneType.length > 0
          ? normalizedData.hormoneType
          : null,
    };

    const student = await db.student.upsert({
      where: { id: studentId },
      create: { ...studentData, userId: auth.userId },
      update: studentData,
    });

    const profileData: Partial<StudentProfileData> = {
      height:
        typeof normalizedData.height === "number"
          ? normalizedData.height
          : undefined,
      weight:
        typeof normalizedData.weight === "number"
          ? normalizedData.weight
          : undefined,
      fitnessLevel:
        typeof normalizedData.fitnessLevel === "string"
          ? normalizedData.fitnessLevel
          : undefined,
      weeklyWorkoutFrequency: normalizedData.weeklyWorkoutFrequency,
      workoutDuration: normalizedData.workoutDuration,
      goals: normalizedData.goals,
      gymType: normalizedData.gymType,
      preferredSets: normalizedData.preferredSets,
      preferredRepRange: normalizedData.preferredRepRange,
      restTime: normalizedData.restTime,
      targetCalories: normalizedData.targetCalories,
      targetProtein: normalizedData.targetProtein,
      targetCarbs: normalizedData.targetCarbs,
      targetFats: normalizedData.targetFats,
      activityLevel: normalizedData.activityLevel,
      hormoneTreatmentDuration: normalizedData.hormoneTreatmentDuration,
      physicalLimitations: normalizedData.physicalLimitations,
      motorLimitations: normalizedData.motorLimitations,
      medicalConditions: normalizedData.medicalConditions,
    };

    await StudentProfileService.saveOnboardingData(student.id, profileData);

    if (typeof normalizedData.weight === "number") {
      await db.weightHistory
        .create({
          data: {
            studentId: student.id,
            weight: normalizedData.weight,
            notes: "Peso inicial do onboarding",
          },
        })
        .catch(() => undefined);
    }

    await db.studentProgress.upsert({
      where: { studentId: student.id },
      update: {},
      create: { studentId: student.id },
    });

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { email: true, name: true },
    });

    if (user?.email) {
      sendWelcomeEmail({
        to: user.email,
        name: user.name || "Aluno",
      }).catch((error) => {
        log.error("[POST /api/students/onboarding] Falha ao enviar email", {
          error,
          userId: auth.userId,
        });
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("[POST /api/students/onboarding] Erro", { error });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao salvar onboarding",
      },
      { status: 500 },
    );
  }
}
