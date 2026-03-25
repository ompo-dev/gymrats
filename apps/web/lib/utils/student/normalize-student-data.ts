import type { StudentData } from "@/lib/types/student-unified";
import { normalizeDailyNutrition } from "@/lib/utils/nutrition/nutrition-plan";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asStringArray(value: unknown): string[] {
  return asArray<unknown>(value).map(String);
}

function normalizeFriends(value: unknown): StudentData["friends"] {
  const source = asRecord(value);
  if (!source) {
    return { count: 0, list: [] };
  }

  const list = asArray<Record<string, unknown>>(source.list).map((friend) => ({
    id: String(friend.id ?? ""),
    name: String(friend.name ?? ""),
    avatar: typeof friend.avatar === "string" ? friend.avatar : undefined,
    username: typeof friend.username === "string" ? friend.username : undefined,
  }));

  return {
    count: typeof source.count === "number" ? source.count : list.length,
    list,
  };
}

export function normalizeStudentProfileData(
  value: unknown,
): StudentData["profile"] {
  const source = asRecord(value);
  if (!source) {
    return {};
  }

  return {
    ...source,
    goals: source.goals !== undefined ? asStringArray(source.goals) : undefined,
    injuries:
      source.injuries !== undefined
        ? asStringArray(source.injuries)
        : undefined,
    availableEquipment:
      source.availableEquipment !== undefined
        ? asStringArray(source.availableEquipment)
        : undefined,
    allergies:
      source.allergies !== undefined
        ? asStringArray(source.allergies)
        : undefined,
    physicalLimitations:
      source.physicalLimitations !== undefined
        ? asStringArray(source.physicalLimitations)
        : undefined,
    motorLimitations:
      source.motorLimitations !== undefined
        ? asStringArray(source.motorLimitations)
        : undefined,
    medicalConditions:
      source.medicalConditions !== undefined
        ? asStringArray(source.medicalConditions)
        : undefined,
  } as StudentData["profile"];
}

export function normalizeStudentSectionData(
  value: Partial<StudentData> | Record<string, unknown> | null | undefined,
): Partial<StudentData> {
  const source = asRecord(value);
  if (!source) {
    return {};
  }

  const weightHistorySource = source.weightHistory;
  const weightHistoryRecord = asRecord(weightHistorySource);
  const normalizedWeightHistory = Array.isArray(weightHistorySource)
    ? weightHistorySource
    : Array.isArray(weightHistoryRecord?.history)
      ? weightHistoryRecord.history
      : undefined;
  const normalizedWeightGain =
    source.weightGain !== undefined
      ? (source.weightGain as StudentData["weightGain"])
      : (weightHistoryRecord?.weightGain as
          | StudentData["weightGain"]
          | undefined);

  const workoutHistorySource = source.workoutHistory;
  const workoutHistoryRecord = asRecord(workoutHistorySource);
  const normalizedWorkoutHistory = Array.isArray(workoutHistorySource)
    ? workoutHistorySource
    : Array.isArray(workoutHistoryRecord?.history)
      ? workoutHistoryRecord.history
      : undefined;

  return {
    ...source,
    profile:
      source.profile !== undefined
        ? normalizeStudentProfileData(source.profile)
        : undefined,
    weightHistory:
      normalizedWeightHistory !== undefined
        ? (normalizedWeightHistory as StudentData["weightHistory"])
        : undefined,
    weightGain: normalizedWeightGain,
    units:
      source.units !== undefined
        ? (asArray(source.units) as StudentData["units"])
        : undefined,
    libraryPlans:
      source.libraryPlans !== undefined
        ? (asArray(source.libraryPlans) as StudentData["libraryPlans"])
        : undefined,
    workoutHistory:
      normalizedWorkoutHistory !== undefined
        ? (normalizedWorkoutHistory as StudentData["workoutHistory"])
        : undefined,
    personalRecords:
      source.personalRecords !== undefined
        ? (asArray(source.personalRecords) as StudentData["personalRecords"])
        : undefined,
    nutritionLibraryPlans:
      source.nutritionLibraryPlans !== undefined
        ? (asArray(
            source.nutritionLibraryPlans,
          ) as StudentData["nutritionLibraryPlans"])
        : undefined,
    memberships:
      source.memberships !== undefined
        ? (asArray(source.memberships) as StudentData["memberships"])
        : undefined,
    payments:
      source.payments !== undefined
        ? (asArray(source.payments) as StudentData["payments"])
        : undefined,
    paymentMethods:
      source.paymentMethods !== undefined
        ? (asArray(source.paymentMethods) as StudentData["paymentMethods"])
        : undefined,
    dayPasses:
      source.dayPasses !== undefined
        ? (asArray(source.dayPasses) as StudentData["dayPasses"])
        : undefined,
    gymLocations:
      source.gymLocations !== undefined
        ? (asArray(source.gymLocations) as StudentData["gymLocations"])
        : undefined,
    dailyNutrition:
      source.dailyNutrition !== undefined
        ? normalizeDailyNutrition(
            source.dailyNutrition as Partial<StudentData["dailyNutrition"]>,
          )
        : undefined,
    friends:
      source.friends !== undefined
        ? normalizeFriends(source.friends)
        : undefined,
  } as Partial<StudentData>;
}
