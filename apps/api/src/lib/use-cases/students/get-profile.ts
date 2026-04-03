import { db } from "@/lib/db";
import { parseJsonArray, parseJsonSafe } from "@/lib/utils/json";

export interface GetStudentProfileInput {
  userId: string;
}

export interface GetStudentProfileOutput {
  hasProfile: boolean;
  student: {
    id: string;
    age: number | null;
    gender: string | null;
    isTrans: boolean;
    usesHormones: boolean;
    hormoneType: string | null;
  } | null;
  profile: {
    height: number | null;
    weight: number | null;
    fitnessLevel: string | null;
    weeklyWorkoutFrequency: number | null;
    workoutDuration: number | null;
    goals: string[];
    availableEquipment: string[];
    gymType: string | null;
    preferredWorkoutTime: string | null;
    preferredSets: number | null;
    preferredRepRange: string | null;
    restTime: string | null;
    bmr: number | null;
    tdee: number | null;
    targetCalories: number | null;
    targetProtein: number | null;
    targetCarbs: number | null;
    targetFats: number | null;
    activityLevel: number | null;
    hormoneTreatmentDuration: number | null;
    physicalLimitations: string[];
    motorLimitations: string[];
    medicalConditions: string[];
    limitationDetails: Record<string, unknown> | null;
    dailyAvailableHours: number | null;
    injuries: string[];
  } | null;
}

export async function getStudentProfileUseCase(
  input: GetStudentProfileInput,
): Promise<GetStudentProfileOutput> {
  const user = await db.user.findUnique({
    where: { id: input.userId },
    include: {
      student: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!user || !user.student) {
    return {
      hasProfile: false,
      student: null,
      profile: null,
    };
  }

  const profile = user.student.profile;
  const hasProfile =
    !!profile &&
    profile.height !== null &&
    profile.weight !== null &&
    profile.fitnessLevel !== null;

  return {
    hasProfile,
    student: {
      id: user.student.id,
      age: user.student.age,
      gender: user.student.gender,
      isTrans: user.student.isTrans ?? false,
      usesHormones: user.student.usesHormones ?? false,
      hormoneType: user.student.hormoneType || null,
    },
    profile:
      profile === null
        ? null
        : {
            height: profile.height,
            weight: profile.weight,
            fitnessLevel: profile.fitnessLevel,
            weeklyWorkoutFrequency: profile.weeklyWorkoutFrequency,
            workoutDuration: profile.workoutDuration,
            goals: parseJsonArray<string>(profile.goals),
            availableEquipment: parseJsonArray<string>(
              profile.availableEquipment,
            ),
            gymType: profile.gymType,
            preferredWorkoutTime: profile.preferredWorkoutTime,
            preferredSets: profile.preferredSets,
            preferredRepRange: profile.preferredRepRange,
            restTime: profile.restTime,
            bmr: profile.bmr,
            tdee: profile.tdee,
            targetCalories: profile.targetCalories,
            targetProtein: profile.targetProtein,
            targetCarbs: profile.targetCarbs,
            targetFats: profile.targetFats,
            activityLevel: profile.activityLevel,
            hormoneTreatmentDuration: profile.hormoneTreatmentDuration,
            physicalLimitations: parseJsonArray<string>(
              profile.physicalLimitations,
            ),
            motorLimitations: parseJsonArray<string>(profile.motorLimitations),
            medicalConditions: parseJsonArray<string>(
              profile.medicalConditions,
            ),
            limitationDetails: parseJsonSafe<Record<string, unknown>>(
              profile.limitationDetails,
            ),
            dailyAvailableHours: profile.dailyAvailableHours,
            injuries: parseJsonArray<string>(profile.injuries),
          },
  };
}
