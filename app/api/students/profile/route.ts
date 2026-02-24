import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { StudentDomainService } from "@/lib/services/student-domain.service";
import { updateStudentProfileSchema } from "@/lib/api/schemas/students.schemas";

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
        profile: user.student.profile ? {
            ...user.student.profile,
            goals: user.student.profile.goals ? JSON.parse(user.student.profile.goals) : [],
            availableEquipment: user.student.profile.availableEquipment ? JSON.parse(user.student.profile.availableEquipment) : [],
            physicalLimitations: user.student.profile.physicalLimitations ? JSON.parse(user.student.profile.physicalLimitations) : [],
            motorLimitations: user.student.profile.motorLimitations ? JSON.parse(user.student.profile.motorLimitations) : [],
            medicalConditions: user.student.profile.medicalConditions ? JSON.parse(user.student.profile.medicalConditions) : [],
            limitationDetails: user.student.profile.limitationDetails ? JSON.parse(user.student.profile.limitationDetails) : null,
            injuries: user.student.profile.injuries ? JSON.parse(user.student.profile.injuries) : [],
        } : null,
    });
  },
  { auth: "student" }
);

export const POST = createSafeHandler(
  async ({ body, studentContext }) => {
    const { studentId, user } = studentContext!;
    const data = body;

    // 1. Atualizar informações básicas do student
    await db.student.update({
      where: { id: studentId },
      data: {
        age: data.age,
        gender: data.gender,
        isTrans: data.isTrans ?? undefined,
        usesHormones: data.usesHormones ?? undefined,
        hormoneType: data.hormoneType || null,
      },
    });

    // 2. Preparar e salvar dados do perfil usando o serviço
    const profileData = {
        studentId,
        height: data.height,
        weight: data.weight,
        fitnessLevel: data.fitnessLevel || null,
        weeklyWorkoutFrequency: data.weeklyWorkoutFrequency,
        workoutDuration: data.workoutDuration,
        goals: data.goals ? JSON.stringify(data.goals) : null,
        injuries: data.injuries ? JSON.stringify(data.injuries) : null,
        availableEquipment: data.availableEquipment ? JSON.stringify(data.availableEquipment) : null,
        gymType: data.gymType || null,
        preferredWorkoutTime: data.preferredWorkoutTime || null,
        preferredSets: data.preferredSets,
        preferredRepRange: data.preferredRepRange || null,
        restTime: data.restTime || null,
        dietType: data.dietType || null,
        allergies: data.allergies ? JSON.stringify(data.allergies) : null,
        targetCalories: data.targetCalories,
        targetProtein: data.targetProtein,
        targetCarbs: data.targetCarbs,
        targetFats: data.targetFats,
        mealsPerDay: data.mealsPerDay,
        bmr: data.bmr,
        tdee: data.tdee,
        activityLevel: data.activityLevel,
        hormoneTreatmentDuration: data.hormoneTreatmentDuration,
        physicalLimitations: data.physicalLimitations ? JSON.stringify(data.physicalLimitations) : null,
        motorLimitations: data.motorLimitations ? JSON.stringify(data.motorLimitations) : null,
        medicalConditions: data.medicalConditions ? JSON.stringify(data.medicalConditions) : null,
        limitationDetails: data.limitationDetails ? JSON.stringify(data.limitationDetails) : null,
        dailyAvailableHours: data.dailyAvailableHours,
    };

    await StudentDomainService.upsertProfile(studentId, profileData);

    // 3. Garantir que progresso existe
    await db.studentProgress.upsert({
        where: { studentId },
        create: { studentId },
        update: {},
    });

    return NextResponse.json({ message: "Perfil salvo com sucesso" });
  },
  {
    auth: "student",
    schema: { body: updateStudentProfileSchema },
  }
);
