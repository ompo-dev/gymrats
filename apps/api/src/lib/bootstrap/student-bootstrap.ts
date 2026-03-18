import {
  createBootstrapResponse,
  measureBootstrapSection,
} from "@gymrats/domain";
import type {
  StudentData,
  StudentDataSection,
} from "@gymrats/types/student-unified";
import { db } from "@/lib/db";
import { ReferralService } from "@/lib/services/referral.service";
import { StudentDomainService } from "@/lib/services/student-domain.service";
import { listTrainingLibraryPlans } from "@/lib/services/workouts/training-library-read.service";
import { getWeeklyPlanUseCase } from "@/lib/use-cases/workouts/get-weekly-plan";

export const DEFAULT_STUDENT_BOOTSTRAP_SECTIONS: StudentDataSection[] = [
  "user",
  "student",
  "progress",
  "units",
  "weeklyPlan",
  "libraryPlans",
  "activeNutritionPlan",
  "nutritionLibraryPlans",
  "profile",
  "weightHistory",
  "workoutHistory",
  "personalRecords",
  "subscription",
  "memberships",
  "payments",
  "paymentMethods",
  "referral",
  "dayPasses",
  "friends",
  "gymLocations",
  "dailyNutrition",
];

export function parseStudentBootstrapSections(
  sectionsParam?: string,
): StudentDataSection[] {
  if (!sectionsParam) {
    return DEFAULT_STUDENT_BOOTSTRAP_SECTIONS;
  }

  const allowed = new Set(DEFAULT_STUDENT_BOOTSTRAP_SECTIONS);
  const sections = sectionsParam
    .split(",")
    .map((section) => section.trim())
    .filter((section): section is StudentDataSection =>
      allowed.has(section as StudentDataSection),
    );

  return sections.length > 0
    ? [...new Set(sections)]
    : DEFAULT_STUDENT_BOOTSTRAP_SECTIONS;
}

export async function buildStudentBootstrap(options: {
  studentId: string;
  userId: string;
  sections?: StudentDataSection[];
}) {
  const sections = options.sections ?? DEFAULT_STUDENT_BOOTSTRAP_SECTIONS;
  const sectionTimings: Record<string, number> = {};
  const mergedData: Partial<StudentData> = {};

  await Promise.all(
    sections.map(async (section) => {
      const sectionPayload = await measureBootstrapSection(
        section,
        sectionTimings,
        async () => {
          if (section === "weeklyPlan") {
            const student = await db.student.findUnique({
              where: { id: options.studentId },
              select: {
                activeWeeklyPlanId: true,
                weekOverride: true,
              },
            });
            const weeklyPlanResult = await getWeeklyPlanUseCase({
              studentId: options.studentId,
              activeWeeklyPlanId: student?.activeWeeklyPlanId ?? null,
              weekOverride: student?.weekOverride ?? null,
            });
            return {
              weeklyPlan: weeklyPlanResult.weeklyPlan,
            } as Partial<StudentData>;
          }

          if (section === "libraryPlans") {
            const libraryPlans = await listTrainingLibraryPlans(options.studentId);
            return {
              libraryPlans,
            } as Partial<StudentData>;
          }

          if (section === "referral") {
            const [code, referralData, student] = await Promise.all([
              ReferralService.getOrGenerateCode(options.studentId),
              ReferralService.getBalanceAndWithdraws(options.studentId),
              db.student.findUnique({
                where: { id: options.studentId },
                select: { pixKey: true, pixKeyType: true },
              }),
            ]);

            return {
              referral: {
                referralCode: code,
                pixKey: student?.pixKey ?? null,
                pixKeyType: student?.pixKeyType ?? null,
                ...referralData,
              },
            } as Partial<StudentData>;
          }

          return StudentDomainService.getAllData(
            options.studentId,
            options.userId,
            [section],
          ) as Promise<Partial<StudentData>>;
        },
      );

      Object.assign(mergedData, sectionPayload);
    }),
  );

  return createBootstrapResponse({
    data: mergedData,
    sectionTimings,
    cache: {
      hit: false,
      strategy: "student-bootstrap",
    },
  });
}
