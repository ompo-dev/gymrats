/**
 * Funções de seleção para dados do Student
 * 
 * Estas funções extraem dados específicos do StudentData,
 * permitindo acesso granular aos dados do store.
 */

import type { StudentData } from "@/lib/types/student-unified";

// ============================================
// SELETORES PRINCIPAIS
// ============================================

export function selectUser(data: StudentData) {
  return data.user;
}

export function selectStudent(data: StudentData) {
  return data.student;
}

export function selectProgress(data: StudentData) {
  return data.progress;
}

export function selectProfile(data: StudentData) {
  return data.profile;
}

export function selectWeightHistory(data: StudentData) {
  return data.weightHistory;
}

export function selectWeightGain(data: StudentData) {
  return data.weightGain;
}

export function selectUnits(data: StudentData) {
  return data.units;
}

export function selectWorkoutHistory(data: StudentData) {
  return data.workoutHistory;
}

export function selectPersonalRecords(data: StudentData) {
  return data.personalRecords;
}

export function selectDailyNutrition(data: StudentData) {
  return data.dailyNutrition;
}

export function selectFoodDatabase(data: StudentData) {
  return data.foodDatabase;
}

export function selectSubscription(data: StudentData) {
  return data.subscription;
}

export function selectMemberships(data: StudentData) {
  return data.memberships;
}

export function selectPayments(data: StudentData) {
  return data.payments;
}

export function selectPaymentMethods(data: StudentData) {
  return data.paymentMethods;
}

export function selectDayPasses(data: StudentData) {
  return data.dayPasses;
}

export function selectFriends(data: StudentData) {
  return data.friends;
}

export function selectGymLocations(data: StudentData) {
  return data.gymLocations;
}

export function selectActiveWorkout(data: StudentData) {
  return data.activeWorkout;
}

export function selectMetadata(data: StudentData) {
  return data.metadata;
}

// ============================================
// SELETORES DE PROPRIEDADES ESPECÍFICAS
// ============================================

export function selectXP(data: StudentData) {
  return data.progress.totalXP;
}

export function selectTodayXP(data: StudentData) {
  return data.progress.todayXP;
}

export function selectCurrentStreak(data: StudentData) {
  return data.progress.currentStreak;
}

export function selectLongestStreak(data: StudentData) {
  return data.progress.longestStreak;
}

export function selectCurrentLevel(data: StudentData) {
  return data.progress.currentLevel;
}

export function selectXPToNextLevel(data: StudentData) {
  return data.progress.xpToNextLevel;
}

export function selectWorkoutsCompleted(data: StudentData) {
  return data.progress.workoutsCompleted;
}

export function selectAchievements(data: StudentData) {
  return data.progress.achievements;
}

export function selectName(data: StudentData) {
  return data.user.name;
}

export function selectEmail(data: StudentData) {
  return data.user.email;
}

export function selectUsername(data: StudentData) {
  return data.user.username;
}

export function selectMemberSince(data: StudentData) {
  return data.user.memberSince;
}

export function selectAvatar(data: StudentData) {
  return data.user.avatar || data.student.avatar;
}

export function selectAge(data: StudentData) {
  return data.student.age;
}

export function selectGender(data: StudentData) {
  return data.student.gender;
}

export function selectPhone(data: StudentData) {
  return data.student.phone;
}

export function selectCurrentWeight(data: StudentData) {
  return data.profile.weight || (data.weightHistory[0]?.weight ?? null);
}

export function selectHeight(data: StudentData) {
  return data.profile.height;
}

export function selectFitnessLevel(data: StudentData) {
  return data.profile.fitnessLevel;
}

export function selectGoals(data: StudentData) {
  return data.profile.goals;
}

export function selectTargetCalories(data: StudentData) {
  return data.profile.targetCalories;
}

export function selectTargetProtein(data: StudentData) {
  return data.profile.targetProtein;
}

export function selectTargetCarbs(data: StudentData) {
  return data.profile.targetCarbs;
}

export function selectTargetFats(data: StudentData) {
  return data.profile.targetFats;
}

export function selectIsAdmin(data: StudentData) {
  return data.user.isAdmin;
}

export function selectRole(data: StudentData) {
  return data.user.role;
}

// ============================================
// MAPA DE SELETORES
// ============================================

export const selectorMap: Record<string, (data: StudentData) => any> = {
  // Seções completas
  user: selectUser,
  student: selectStudent,
  progress: selectProgress,
  profile: selectProfile,
  weightHistory: selectWeightHistory,
  weightGain: selectWeightGain,
  units: selectUnits,
  workoutHistory: selectWorkoutHistory,
  personalRecords: selectPersonalRecords,
  dailyNutrition: selectDailyNutrition,
  foodDatabase: selectFoodDatabase,
  subscription: selectSubscription,
  memberships: selectMemberships,
  payments: selectPayments,
  paymentMethods: selectPaymentMethods,
  dayPasses: selectDayPasses,
  friends: selectFriends,
  gymLocations: selectGymLocations,
  activeWorkout: selectActiveWorkout,
  metadata: selectMetadata,

  // Propriedades específicas
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

/**
 * Seleciona dados do StudentData baseado em uma string de seletor
 */
export function selectFromData(
  data: StudentData,
  selector: string
): any {
  const selectFn = selectorMap[selector];
  if (selectFn) {
    return selectFn(data);
  }

  // Fallback: tentar acessar diretamente
  if (selector in data) {
    return (data as any)[selector];
  }

  // Se não encontrar, retornar undefined
  console.warn(`Seletor "${selector}" não encontrado`);
  return undefined;
}

/**
 * Seleciona múltiplos dados de uma vez
 */
export function selectMultiple(
  data: StudentData,
  selectors: string[]
): Record<string, any> {
  const result: Record<string, any> = {};
  selectors.forEach((selector) => {
    result[selector] = selectFromData(data, selector);
  });
  return result;
}

