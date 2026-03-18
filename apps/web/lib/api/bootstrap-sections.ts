import type { GymDataSection } from "@/lib/types/gym-unified";
import type { PersonalDataSection } from "@/lib/types/personal-unified";
import type { StudentDataSection } from "@/lib/types/student-unified";

export const DEFAULT_STUDENT_BOOTSTRAP_SECTIONS = [
  "progress",
  "workoutHistory",
  "profile",
  "weeklyPlan",
  "units",
  "dailyNutrition",
  "subscription",
] as const satisfies readonly StudentDataSection[];

export const DEFAULT_GYM_BOOTSTRAP_SECTIONS = [
  "stats",
  "recentCheckIns",
  "students",
  "equipment",
  "profile",
  "subscription",
] as const satisfies readonly GymDataSection[];

export const DEFAULT_PERSONAL_BOOTSTRAP_SECTIONS = [
  "profile",
  "affiliations",
  "students",
  "subscription",
] as const satisfies readonly PersonalDataSection[];
