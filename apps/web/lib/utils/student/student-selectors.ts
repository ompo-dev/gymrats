/**
 * Funções de seleção para dados do Student.
 * Seletores simples gerados automaticamente; compostos explícitos.
 */

import type {
  StudentData,
  WeightHistoryItem,
} from "@/lib/types/student-unified";

export interface StudentSelectorValueMap {
  user: StudentData["user"];
  student: StudentData["student"];
  progress: StudentData["progress"];
  profile: StudentData["profile"];
  weightHistory: WeightHistoryItem[];
  weightGain: StudentData["weightGain"];
  units: StudentData["units"];
  weeklyPlan: StudentData["weeklyPlan"];
  libraryPlans: StudentData["libraryPlans"];
  workoutHistory: StudentData["workoutHistory"];
  personalRecords: StudentData["personalRecords"];
  activeNutritionPlan: StudentData["activeNutritionPlan"];
  nutritionLibraryPlans: StudentData["nutritionLibraryPlans"];
  dailyNutrition: StudentData["dailyNutrition"];
  foodDatabase: StudentData["foodDatabase"];
  subscription: StudentData["subscription"];
  memberships: StudentData["memberships"];
  payments: StudentData["payments"];
  paymentMethods: StudentData["paymentMethods"];
  referral: StudentData["referral"];
  dayPasses: StudentData["dayPasses"];
  friends: StudentData["friends"];
  gymLocations: StudentData["gymLocations"];
  activeWorkout: StudentData["activeWorkout"];
  metadata: StudentData["metadata"];
  xp: StudentData["progress"]["totalXP"];
  totalXP: StudentData["progress"]["totalXP"];
  todayXP: StudentData["progress"]["todayXP"];
  currentStreak: StudentData["progress"]["currentStreak"];
  longestStreak: StudentData["progress"]["longestStreak"];
  currentLevel: StudentData["progress"]["currentLevel"];
  level: StudentData["progress"]["currentLevel"];
  xpToNextLevel: StudentData["progress"]["xpToNextLevel"];
  workoutsCompleted: StudentData["progress"]["workoutsCompleted"];
  achievements: StudentData["progress"]["achievements"];
  name: StudentData["user"]["name"];
  email: StudentData["user"]["email"];
  username: StudentData["user"]["username"];
  memberSince: StudentData["user"]["memberSince"];
  avatar: string | undefined;
  age: StudentData["student"]["age"];
  gender: StudentData["student"]["gender"];
  phone: StudentData["student"]["phone"];
  currentWeight: number | null;
  weight: number | null;
  height: StudentData["profile"]["height"];
  fitnessLevel: StudentData["profile"]["fitnessLevel"];
  goals: StudentData["profile"]["goals"];
  targetCalories: StudentData["profile"]["targetCalories"];
  targetProtein: StudentData["profile"]["targetProtein"];
  targetCarbs: StudentData["profile"]["targetCarbs"];
  targetFats: StudentData["profile"]["targetFats"];
  isAdmin: StudentData["user"]["isAdmin"];
  role: StudentData["user"]["role"];
}

export type StudentDataSelectorKey = keyof StudentSelectorValueMap;

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

  return Array.isArray(
    (d.weightHistory as { history?: unknown[] } | undefined)?.history,
  )
    ? (((d.weightHistory as { history?: unknown[] }).history ??
        []) as WeightHistoryItem[])
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
export function selectWorkoutHistory(
  d: StudentData,
): StudentData["workoutHistory"] {
  return Array.isArray(d.workoutHistory)
    ? d.workoutHistory
    : Array.isArray(
          (d.workoutHistory as { history?: unknown[] } | undefined)?.history,
        )
      ? (((d.workoutHistory as { history?: unknown[] }).history ??
          []) as StudentData["workoutHistory"])
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
  return profile?.weight ?? weightHistory[0]?.weight ?? null;
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

export const selectorMap: {
  [K in StudentDataSelectorKey]: (
    data: StudentData,
  ) => StudentSelectorValueMap[K];
} = {
  user: selectUser,
  student: selectStudent,
  progress: selectProgress,
  profile: selectProfile,
  weightHistory: selectWeightHistory,
  weightGain: selectWeightGain,
  units: selectUnits,
  weeklyPlan: selectWeeklyPlan,
  libraryPlans: (d) => d.libraryPlans,
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

export function selectFromData<S extends StudentDataSelectorKey>(
  data: StudentData,
  selector: S,
): StudentSelectorValueMap[S] {
  return selectorMap[selector](data);
}

export function selectMultiple<S extends readonly StudentDataSelectorKey[]>(
  data: StudentData,
  selectors: S,
): { [K in S[number]]: StudentSelectorValueMap[K] } {
  const result = {} as { [K in S[number]]: StudentSelectorValueMap[K] };
  for (const selector of selectors) {
    (result as Record<StudentDataSelectorKey, unknown>)[selector] =
      selectFromData(data, selector);
  }
  return result;
}
