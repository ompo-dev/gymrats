import type {
  DailyNutrition,
  DifficultyLevel,
  ExerciseLog,
  Meal,
  MuscleGroup,
  PersonalRecord,
  Unit,
  UserProgress,
  WorkoutExercise,
  WorkoutHistory,
  WorkoutSession,
  WorkoutType,
} from "@/lib/types";
import type {
  ActiveWorkout,
  FriendsData,
  StudentData,
  StudentProfileData,
  SubscriptionData,
  WeightHistoryItem,
} from "@/lib/types/student-unified";

type ApiRecord = Record<string, unknown>;

const difficultyLevels = [
  "iniciante",
  "intermediario",
  "avancado",
] as const satisfies readonly DifficultyLevel[];
const muscleGroups = [
  "peito",
  "costas",
  "pernas",
  "ombros",
  "bracos",
  "core",
  "gluteos",
  "cardio",
  "funcional",
] as const satisfies readonly MuscleGroup[];
const workoutTypes = [
  "strength",
  "cardio",
  "flexibility",
  "rest",
] as const satisfies readonly WorkoutType[];
const workoutFeedbackOptions = [
  "excelente",
  "bom",
  "regular",
  "ruim",
] as const satisfies readonly NonNullable<WorkoutHistory["overallFeedback"]>[];
const personalRecordTypes = [
  "max-weight",
  "max-reps",
  "max-volume",
] as const satisfies readonly PersonalRecord["type"][];
const subscriptionStatuses = [
  "active",
  "canceled",
  "expired",
  "past_due",
  "trialing",
  "pending_payment",
] as const satisfies readonly SubscriptionData["status"][];
const subscriptionSources = [
  "OWN",
  "GYM_ENTERPRISE",
] as const satisfies readonly NonNullable<SubscriptionData["source"]>[];
const billingPeriods = [
  "monthly",
  "annual",
] as const satisfies readonly NonNullable<SubscriptionData["billingPeriod"]>[];
const cardioPreferences = [
  "none",
  "before",
  "after",
] as const satisfies readonly NonNullable<ActiveWorkout["cardioPreference"]>[];
const hormoneTypes = [
  "testosterone",
  "estrogen",
  "none",
] as const satisfies readonly NonNullable<
  StudentData["student"]["hormoneType"]
>[];
const userRoles = [
  "STUDENT",
  "ADMIN",
  "GYM",
] as const satisfies readonly StudentData["user"]["role"][];

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  return undefined;
}

function asDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  return undefined;
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    const parsed = parseJson(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  }

  return [];
}

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => asNumber(item)).filter(isDefined);
}

function asRecordArray(value: unknown): ApiRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function asEnumValue<T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
): T[number] | undefined {
  return typeof value === "string" && allowedValues.includes(value)
    ? value
    : undefined;
}

function asStringRecord(
  value: unknown,
): Record<string, string | string[]> | undefined {
  if (typeof value === "string") {
    return asStringRecord(parseJson(value));
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const entries = Object.entries(value)
    .map(([key, entryValue]) => {
      if (typeof entryValue === "string") {
        return [key, entryValue] as const;
      }

      const stringArray = asStringArray(entryValue);
      return stringArray.length > 0 ? ([key, stringArray] as const) : undefined;
    })
    .filter(isDefined);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function asObjectArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function transformWeightHistoryItem(item: ApiRecord): WeightHistoryItem | null {
  const weight = asNumber(item.weight);
  if (weight === undefined) {
    return null;
  }

  return {
    date: asDate(item.date) ?? asString(item.date) ?? new Date(),
    weight,
    notes: asString(item.notes),
  };
}

function transformWorkoutExercise(exercise: ApiRecord): WorkoutExercise {
  return {
    id: asString(exercise.id) ?? "",
    name: asString(exercise.name) ?? "",
    sets: asNumber(exercise.sets) ?? 0,
    reps: asString(exercise.reps) ?? "0",
    rest: asNumber(exercise.rest) ?? 0,
    notes: asString(exercise.notes),
    videoUrl: asString(exercise.videoUrl),
    completed: asBoolean(exercise.completed),
    educationalId: asString(exercise.educationalId),
    alternatives: Array.isArray(exercise.alternatives)
      ? (exercise.alternatives as WorkoutExercise["alternatives"])
      : undefined,
    selectedAlternative: asString(exercise.selectedAlternative),
    primaryMuscles: asStringArray(exercise.primaryMuscles),
    secondaryMuscles: asStringArray(exercise.secondaryMuscles),
    difficulty: asEnumValue(exercise.difficulty, difficultyLevels),
    equipment: asStringArray(exercise.equipment),
    instructions: asStringArray(exercise.instructions),
    tips: asStringArray(exercise.tips),
    commonMistakes: asStringArray(exercise.commonMistakes),
    benefits: asStringArray(exercise.benefits),
    scientificEvidence: asString(exercise.scientificEvidence),
    order: asNumber(exercise.order),
    createdAt: asDate(exercise.createdAt),
    updatedAt: asDate(exercise.updatedAt),
    educationSlug: asString(exercise.educationSlug),
  };
}

function transformWorkoutSession(workout: ApiRecord): WorkoutSession {
  return {
    id: asString(workout.id) ?? "",
    title: asString(workout.title) ?? asString(workout.name) ?? "",
    description: asString(workout.description) ?? "",
    type: asEnumValue(workout.type, workoutTypes) ?? "strength",
    muscleGroup: asEnumValue(workout.muscleGroup, muscleGroups) ?? "funcional",
    difficulty:
      asEnumValue(workout.difficulty, difficultyLevels) ?? "intermediario",
    exercises: asRecordArray(workout.exercises).map(transformWorkoutExercise),
    xpReward: asNumber(workout.xpReward) ?? 0,
    estimatedTime: asNumber(workout.estimatedTime) ?? 0,
    order: asNumber(workout.order),
    locked: asBoolean(workout.locked) ?? false,
    completed: asBoolean(workout.completed) ?? false,
    stars: asNumber(workout.stars),
    completedAt: asDate(workout.completedAt),
  };
}

function transformProgress(progress: ApiRecord): UserProgress {
  return {
    currentStreak: asNumber(progress.currentStreak) ?? 0,
    longestStreak: asNumber(progress.longestStreak) ?? 0,
    totalXP: asNumber(progress.totalXP) ?? 0,
    currentLevel: asNumber(progress.currentLevel) ?? 1,
    xpToNextLevel: asNumber(progress.xpToNextLevel) ?? 100,
    workoutsCompleted: asNumber(progress.workoutsCompleted) ?? 0,
    todayXP: asNumber(progress.todayXP) ?? 0,
    achievements: asObjectArray<UserProgress["achievements"][number]>(
      progress.achievements,
    ),
    lastActivityDate:
      asString(progress.lastActivityDate) ?? new Date().toISOString(),
    dailyGoalXP: asNumber(progress.dailyGoalXP) ?? 50,
    weeklyXP: asNumberArray(progress.weeklyXP)
      .slice(0, 7)
      .concat([0, 0, 0, 0, 0, 0, 0])
      .slice(0, 7),
  };
}

function transformProfile(profile: ApiRecord): StudentProfileData {
  const goals = asStringArray(profile.goals);

  return {
    height: asNumber(profile.height),
    weight: asNumber(profile.weight),
    fitnessLevel: asString(profile.fitnessLevel),
    weeklyWorkoutFrequency: asNumber(profile.weeklyWorkoutFrequency),
    workoutDuration: asNumber(profile.workoutDuration),
    goals,
    injuries: asStringArray(profile.injuries),
    availableEquipment: asStringArray(profile.availableEquipment),
    gymType: asString(profile.gymType),
    preferredWorkoutTime: asString(profile.preferredWorkoutTime),
    preferredSets: asNumber(profile.preferredSets),
    preferredRepRange: asString(profile.preferredRepRange),
    restTime: asString(profile.restTime),
    dietType: asString(profile.dietType),
    allergies: asStringArray(profile.allergies),
    targetCalories: asNumber(profile.targetCalories),
    targetProtein: asNumber(profile.targetProtein),
    targetCarbs: asNumber(profile.targetCarbs),
    targetFats: asNumber(profile.targetFats),
    targetWater: asNumber(profile.targetWater),
    mealsPerDay: asNumber(profile.mealsPerDay),
    hasWeightLossGoal:
      asBoolean(profile.hasWeightLossGoal) ?? goals.includes("perder-peso"),
    dailyAvailableHours: asNumber(profile.dailyAvailableHours),
    bmr: asNumber(profile.bmr),
    tdee: asNumber(profile.tdee),
    activityLevel: asNumber(profile.activityLevel),
    hormoneTreatmentDuration: asNumber(profile.hormoneTreatmentDuration),
    physicalLimitations: asStringArray(profile.physicalLimitations),
    motorLimitations: asStringArray(profile.motorLimitations),
    medicalConditions: asStringArray(profile.medicalConditions),
    limitationDetails: asStringRecord(profile.limitationDetails),
  };
}

function transformUnit(unit: ApiRecord): Unit {
  return {
    id: asString(unit.id) ?? "",
    title: asString(unit.title) ?? "",
    description: asString(unit.description) ?? "",
    workouts: asRecordArray(unit.workouts).map(transformWorkoutSession),
    color: asString(unit.color) ?? "#58CC02",
    icon: asString(unit.icon) ?? "workout",
    studentId: asString(unit.studentId),
  };
}

function transformWorkoutHistory(workout: ApiRecord): WorkoutHistory {
  return {
    date: asDate(workout.date) ?? new Date(),
    workoutId: asString(workout.workoutId) ?? "",
    workoutName: asString(workout.workoutName) ?? asString(workout.name) ?? "",
    duration: asNumber(workout.duration) ?? 0,
    totalVolume: asNumber(workout.totalVolume) ?? 0,
    exercises: asObjectArray<ExerciseLog>(workout.exercises),
    overallFeedback: asEnumValue(
      workout.overallFeedback,
      workoutFeedbackOptions,
    ),
    bodyPartsFatigued: asStringArray(workout.bodyPartsFatigued)
      .map((item) => asEnumValue(item, muscleGroups))
      .filter(isDefined),
  };
}

function transformPersonalRecord(record: ApiRecord): PersonalRecord {
  return {
    exerciseId: asString(record.exerciseId) ?? "",
    exerciseName: asString(record.exerciseName) ?? "",
    type: asEnumValue(record.type, personalRecordTypes) ?? "max-weight",
    value: asNumber(record.value) ?? 0,
    date: asDate(record.date) ?? new Date(),
    previousBest: asNumber(record.previousBest),
  };
}

function transformDailyNutrition(nutrition: ApiRecord): DailyNutrition {
  const date = asDate(nutrition.date);

  return {
    date:
      asString(nutrition.date) ??
      (date
        ? date.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0]),
    meals: asObjectArray<Meal>(nutrition.meals),
    totalCalories: asNumber(nutrition.totalCalories) ?? 0,
    totalProtein: asNumber(nutrition.totalProtein) ?? 0,
    totalCarbs: asNumber(nutrition.totalCarbs) ?? 0,
    totalFats: asNumber(nutrition.totalFats) ?? 0,
    waterIntake: asNumber(nutrition.waterIntake) ?? 0,
    targetCalories: asNumber(nutrition.targetCalories) ?? 2000,
    targetProtein: asNumber(nutrition.targetProtein) ?? 150,
    targetCarbs: asNumber(nutrition.targetCarbs) ?? 250,
    targetFats: asNumber(nutrition.targetFats) ?? 65,
    targetWater: asNumber(nutrition.targetWater) ?? 3000,
    sourceNutritionPlanId: asString(nutrition.sourceNutritionPlanId) ?? null,
    hasActiveNutritionPlan: asBoolean(nutrition.hasActiveNutritionPlan),
    isLegacyFallback: asBoolean(nutrition.isLegacyFallback),
  };
}

function transformSubscription(subscription: ApiRecord): SubscriptionData {
  return {
    id: asString(subscription.id),
    plan: asString(subscription.plan) ?? "free",
    status: asEnumValue(subscription.status, subscriptionStatuses) ?? "active",
    currentPeriodStart: asDate(subscription.currentPeriodStart),
    currentPeriodEnd: asDate(subscription.currentPeriodEnd),
    cancelAtPeriodEnd: asBoolean(subscription.cancelAtPeriodEnd),
    canceledAt: asDate(subscription.canceledAt) ?? null,
    trialStart: asDate(subscription.trialStart) ?? null,
    trialEnd: asDate(subscription.trialEnd) ?? null,
    isTrial: asBoolean(subscription.isTrial),
    daysRemaining:
      subscription.daysRemaining === null
        ? null
        : (asNumber(subscription.daysRemaining) ?? null),
    billingPeriod: asEnumValue(subscription.billingPeriod, billingPeriods),
    source: asEnumValue(subscription.source, subscriptionSources),
    gymId: asString(subscription.gymId),
    enterpriseGymName: asString(subscription.enterpriseGymName),
  };
}

function transformActiveWorkout(workout: ApiRecord): ActiveWorkout {
  return {
    workoutId: asString(workout.workoutId) ?? "",
    currentExerciseIndex: asNumber(workout.currentExerciseIndex) ?? 0,
    exerciseLogs: asObjectArray<ExerciseLog>(workout.exerciseLogs),
    skippedExercises: asStringArray(workout.skippedExercises),
    selectedAlternatives: (isRecord(workout.selectedAlternatives)
      ? Object.fromEntries(
          Object.entries(workout.selectedAlternatives).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        )
      : {}) as Record<string, string>,
    xpEarned: asNumber(workout.xpEarned) ?? 0,
    totalVolume: asNumber(workout.totalVolume) ?? 0,
    completionPercentage: asNumber(workout.completionPercentage) ?? 0,
    startTime: asDate(workout.startTime) ?? new Date(),
    lastUpdated: asDate(workout.lastUpdated) ?? new Date(),
    cardioPreference: asEnumValue(workout.cardioPreference, cardioPreferences),
    cardioDuration: asNumber(workout.cardioDuration),
    selectedCardioType: asString(workout.selectedCardioType),
  };
}

function transformFriends(value: unknown): FriendsData {
  if (Array.isArray(value)) {
    const list = value.filter(isRecord).map((friend) => ({
      id: asString(friend.id) ?? "",
      name: asString(friend.name) ?? "",
      avatar: asString(friend.avatar),
      username: asString(friend.username),
    }));

    return {
      count: list.length,
      list,
    };
  }

  if (!isRecord(value)) {
    return { count: 0, list: [] };
  }

  const list = asRecordArray(value.list).map((friend) => ({
    id: asString(friend.id) ?? "",
    name: asString(friend.name) ?? "",
    avatar: asString(friend.avatar),
    username: asString(friend.username),
  }));

  return {
    count: asNumber(value.count) ?? list.length,
    list,
  };
}

export function transformStudentData(apiData: ApiRecord): Partial<StudentData> {
  const transformed: Partial<StudentData> = {};
  const user = isRecord(apiData.user) ? apiData.user : undefined;
  const student = isRecord(apiData.student) ? apiData.student : undefined;
  const progress = isRecord(apiData.progress) ? apiData.progress : undefined;
  const profile = isRecord(apiData.profile) ? apiData.profile : undefined;
  const dailyNutrition = isRecord(apiData.dailyNutrition)
    ? apiData.dailyNutrition
    : undefined;
  const subscription = isRecord(apiData.subscription)
    ? apiData.subscription
    : undefined;
  const activeWorkout = isRecord(apiData.activeWorkout)
    ? apiData.activeWorkout
    : undefined;

  if (user) {
    const email = asString(user.email) ?? "";
    const role = asEnumValue(user.role, userRoles) ?? "STUDENT";

    transformed.user = {
      id: asString(user.id) ?? "",
      name: asString(user.name) ?? "",
      email,
      username: asString(user.username) ?? generateUsername(email),
      memberSince:
        asString(user.memberSince) ??
        formatMemberSince(asDate(user.createdAt) ?? asString(user.createdAt)),
      avatar: asString(user.avatar) ?? asString(user.image),
      role,
      isAdmin: role === "ADMIN" || asBoolean(user.isAdmin) === true,
    };
  }

  if (student) {
    transformed.student = {
      id: asString(student.id) ?? "",
      age: asNumber(student.age),
      gender: asString(student.gender),
      phone: asString(student.phone),
      avatar: asString(student.avatar),
      isTrans: asBoolean(student.isTrans) ?? false,
      usesHormones: asBoolean(student.usesHormones) ?? false,
      hormoneType: asEnumValue(student.hormoneType, hormoneTypes),
    };
  }

  if (progress) {
    transformed.progress = transformProgress(progress);
  }

  if (profile) {
    transformed.profile = transformProfile(profile);
  }

  if (apiData.weightHistory !== undefined) {
    transformed.weightHistory = asRecordArray(apiData.weightHistory)
      .map(transformWeightHistoryItem)
      .filter(isDefined);
  }

  if (apiData.units !== undefined) {
    transformed.units = asRecordArray(apiData.units).map(transformUnit);
  }

  if (apiData.workoutHistory !== undefined) {
    transformed.workoutHistory = asRecordArray(apiData.workoutHistory).map(
      transformWorkoutHistory,
    );
  }

  if (apiData.personalRecords !== undefined) {
    transformed.personalRecords = asRecordArray(apiData.personalRecords).map(
      transformPersonalRecord,
    );
  }

  if (dailyNutrition) {
    transformed.dailyNutrition = transformDailyNutrition(dailyNutrition);
  }

  if (apiData.subscription !== undefined) {
    transformed.subscription = subscription
      ? transformSubscription(subscription)
      : null;
  }

  if (Array.isArray(apiData.memberships)) {
    transformed.memberships = apiData.memberships as StudentData["memberships"];
  }

  if (Array.isArray(apiData.payments)) {
    transformed.payments = apiData.payments as StudentData["payments"];
  }

  if (Array.isArray(apiData.paymentMethods)) {
    transformed.paymentMethods =
      apiData.paymentMethods as StudentData["paymentMethods"];
  }

  if (Array.isArray(apiData.dayPasses)) {
    transformed.dayPasses = apiData.dayPasses as StudentData["dayPasses"];
  }

  if (Array.isArray(apiData.gymLocations)) {
    transformed.gymLocations =
      apiData.gymLocations as StudentData["gymLocations"];
  }

  if (apiData.friends !== undefined) {
    transformed.friends = transformFriends(apiData.friends);
  }

  if (Array.isArray(apiData.foodDatabase)) {
    transformed.foodDatabase =
      apiData.foodDatabase as StudentData["foodDatabase"];
  }

  if (activeWorkout) {
    transformed.activeWorkout = transformActiveWorkout(activeWorkout);
  }

  return transformed;
}

function generateUsername(email?: string): string {
  if (!email) return "@usuario";
  const username = email.split("@")[0]?.toLowerCase() ?? "usuario";
  return `@${username}`;
}

function formatMemberSince(date: Date | string | null | undefined): string {
  if (!date) return "Jan 2025";

  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) {
    return "Jan 2025";
  }

  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  return `${months[parsed.getMonth()] ?? "Jan"} ${parsed.getFullYear()}`;
}

export function transformToAPI(
  data: Partial<StudentData>,
): Record<string, unknown> {
  return { ...data };
}
