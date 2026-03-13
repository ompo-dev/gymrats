/**
 * Funções de seleção para dados do Student.
 * Seletores simples gerados automaticamente; compostos explícitos.
 */

import type { StudentData, WeightHistoryItem } from "@/lib/types/student-unified";

export function selectUser(d: StudentData) {
  return d.user;
}
export function selectStudent(d: StudentData) {
  return d.student;
}
export function selectProgress(d: StudentData) {
  return d.progress;
}
export function selectProfile(d: StudentData) {
  return d.profile;
}
export function selectWeightHistory(d: StudentData): WeightHistoryItem[] {
  if (Array.isArray(d.weightHistory)) {
    return d.weightHistory as WeightHistoryItem[];
  }

  return Array.isArray((d.weightHistory as { history?: unknown[] } | undefined)?.history)
    ? (((d.weightHistory as { history?: unknown[] }).history ?? []) as WeightHistoryItem[])
    : [];
}
export function selectWeightGain(d: StudentData) {
  return d.weightGain;
}
export function selectUnits(d: StudentData) {
  return d.units;
}
export function selectWeeklyPlan(d: StudentData) {
  return d.weeklyPlan;
}
export function selectWorkoutHistory(d: StudentData) {
  return Array.isArray(d.workoutHistory)
    ? d.workoutHistory
    : Array.isArray((d.workoutHistory as { history?: unknown[] } | undefined)?.history)
      ? ((d.workoutHistory as { history?: unknown[] }).history ?? [])
      : [];
}
export function selectPersonalRecords(d: StudentData) {
  return d.personalRecords;
}
export function selectDailyNutrition(d: StudentData) {
  return d.dailyNutrition;
}
export function selectActiveNutritionPlan(d: StudentData) {
  return d.activeNutritionPlan;
}
export function selectNutritionLibraryPlans(d: StudentData) {
  return d.nutritionLibraryPlans;
}
export function selectFoodDatabase(d: StudentData) {
  return d.foodDatabase;
}
export function selectSubscription(d: StudentData) {
  return d.subscription;
}
export function selectMemberships(d: StudentData) {
  return d.memberships;
}
export function selectPayments(d: StudentData) {
  return d.payments;
}
export function selectPaymentMethods(d: StudentData) {
  return d.paymentMethods;
}
export function selectReferral(d: StudentData) {
  return d.referral;
}
export function selectDayPasses(d: StudentData) {
  return d.dayPasses;
}
export function selectFriends(d: StudentData) {
  return d.friends;
}
export function selectGymLocations(d: StudentData) {
  return d.gymLocations;
}
export function selectActiveWorkout(d: StudentData) {
  return d.activeWorkout;
}
export function selectMetadata(d: StudentData) {
  return d.metadata;
}

export function selectXP(d: StudentData) {
  return d.progress.totalXP;
}
export function selectTodayXP(d: StudentData) {
  return d.progress.todayXP;
}
export function selectCurrentStreak(d: StudentData) {
  return d.progress.currentStreak;
}
export function selectLongestStreak(d: StudentData) {
  return d.progress.longestStreak;
}
export function selectCurrentLevel(d: StudentData) {
  return d.progress.currentLevel;
}
export function selectXPToNextLevel(d: StudentData) {
  return d.progress.xpToNextLevel;
}
export function selectWorkoutsCompleted(d: StudentData) {
  return d.progress.workoutsCompleted;
}
export function selectAchievements(d: StudentData) {
  return d.progress.achievements;
}

export function selectName(d: StudentData) {
  return d.user.name;
}
export function selectEmail(d: StudentData) {
  return d.user.email;
}
export function selectUsername(d: StudentData) {
  return d.user.username;
}
export function selectMemberSince(d: StudentData) {
  return d.user.memberSince;
}
export function selectAvatar(d: StudentData) {
  return d.user.avatar || d.student.avatar;
}
export function selectAge(d: StudentData) {
  return d.student.age;
}
export function selectGender(d: StudentData) {
  return d.student.gender;
}
export function selectPhone(d: StudentData) {
  return d.student.phone;
}

export function selectCurrentWeight(d: StudentData) {
  const weightHistory = selectWeightHistory(d);
  const profile = d.profile as { weight?: number } | null | undefined;
  return profile?.weight ?? (weightHistory[0]?.weight ?? null);
}
export function selectHeight(d: StudentData) {
  return d.profile.height;
}
export function selectFitnessLevel(d: StudentData) {
  return d.profile.fitnessLevel;
}
export function selectGoals(d: StudentData) {
  return d.profile.goals;
}
export function selectTargetCalories(d: StudentData) {
  return d.profile.targetCalories;
}
export function selectTargetProtein(d: StudentData) {
  return d.profile.targetProtein;
}
export function selectTargetCarbs(d: StudentData) {
  return d.profile.targetCarbs;
}
export function selectTargetFats(d: StudentData) {
  return d.profile.targetFats;
}

export function selectIsAdmin(d: StudentData) {
  return d.user.isAdmin;
}
export function selectRole(d: StudentData) {
  return d.user.role;
}

export const selectorMap: Record<string, (data: StudentData) => unknown> = {
  user: selectUser,
  student: selectStudent,
  progress: selectProgress,
  profile: selectProfile,
  weightHistory: selectWeightHistory,
  weightGain: selectWeightGain,
  units: selectUnits,
  weeklyPlan: selectWeeklyPlan,
  workoutHistory: selectWorkoutHistory,
  personalRecords: selectPersonalRecords,
  activeNutritionPlan: selectActiveNutritionPlan,
  nutritionLibraryPlans: selectNutritionLibraryPlans,
  dailyNutrition: selectDailyNutrition,
  foodDatabase: selectFoodDatabase,
  subscription: selectSubscription,
  memberships: selectMemberships,
  payments: selectPayments,
  paymentMethods: selectPaymentMethods,
  referral: selectReferral,
  dayPasses: selectDayPasses,
  friends: selectFriends,
  gymLocations: selectGymLocations,
  activeWorkout: selectActiveWorkout,
  metadata: selectMetadata,
  xp: selectXP,
  totalXP: selectXP,
  todayXP: selectTodayXP,
  currentStreak: selectCurrentStreak,
  longestStreak: selectLongestStreak,
  currentLevel: selectCurrentLevel,
  level: selectCurrentLevel,
  xpToNextLevel: selectXPToNextLevel,
  workoutsCompleted: selectWorkoutsCompleted,
  achievements: selectAchievements,
  name: selectName,
  email: selectEmail,
  username: selectUsername,
  memberSince: selectMemberSince,
  avatar: selectAvatar,
  age: selectAge,
  gender: selectGender,
  phone: selectPhone,
  currentWeight: selectCurrentWeight,
  weight: selectCurrentWeight,
  height: selectHeight,
  fitnessLevel: selectFitnessLevel,
  goals: selectGoals,
  targetCalories: selectTargetCalories,
  targetProtein: selectTargetProtein,
  targetCarbs: selectTargetCarbs,
  targetFats: selectTargetFats,
  isAdmin: selectIsAdmin,
  role: selectRole,
};

export function selectFromData(
  data: StudentData,
  selector: string,
): string | number | boolean | object | null | undefined {
  const selectFn = selectorMap[selector];
  if (selectFn) {
    return selectFn(data) as
      | string
      | number
      | boolean
      | object
      | null
      | undefined;
  }
  if (selector in data)
    return (
      data as unknown as Record<
        string,
        string | number | boolean | object | null | undefined
      >
    )[selector];
  return undefined;
}

export function selectMultiple(
  data: StudentData,
  selectors: string[],
): Record<string, string | number | boolean | object | null | undefined> {
  const result: Record<
    string,
    string | number | boolean | object | null | undefined
  > = {};
  for (const selector of selectors) {
    result[selector] = selectFromData(data, selector);
  }
  return result;
}
