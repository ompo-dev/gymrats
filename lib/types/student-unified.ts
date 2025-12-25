/**
 * Tipos consolidados para o Store Unificado do Student
 * 
 * Este arquivo contém todas as interfaces necessárias para o store unificado,
 * consolidando tipos de múltiplos stores antigos.
 */

import type {
  UserProgress,
  Achievement,
  WorkoutHistory,
  PersonalRecord,
  Unit,
  DailyNutrition,
  FoodItem,
  ExerciseLog,
  StudentGymMembership,
  StudentPayment,
  PaymentMethod,
  DayPass,
  GymLocation,
} from "@/lib/types";

// ============================================
// USER INFO
// ============================================

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  username: string; // Gerado de email: @username
  memberSince: string; // Formato: "Jan 2025"
  avatar?: string;
  role: "STUDENT" | "ADMIN" | "GYM";
  isAdmin: boolean;
}

// ============================================
// STUDENT INFO
// ============================================

export interface StudentInfo {
  id: string;
  age?: number;
  gender?: string;
  phone?: string;
  avatar?: string;
}

// ============================================
// PROFILE
// ============================================

export interface StudentProfileData {
  height?: number; // cm
  weight?: number; // kg (atual - último registro de WeightHistory)
  fitnessLevel?: string;
  weeklyWorkoutFrequency?: number;
  workoutDuration?: number; // minutos
  goals?: string[];
  injuries?: string[];
  availableEquipment?: string[];
  gymType?: string;
  preferredWorkoutTime?: string;
  preferredSets?: number;
  preferredRepRange?: string;
  restTime?: string;
  dietType?: string;
  allergies?: string[];
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFats?: number;
  mealsPerDay?: number;
  hasWeightLossGoal?: boolean;
}

// ============================================
// WEIGHT HISTORY
// ============================================

export interface WeightHistoryItem {
  date: Date | string;
  weight: number;
  notes?: string;
}

// ============================================
// SUBSCRIPTION
// ============================================

export interface SubscriptionData {
  id: string;
  plan: "free" | "premium";
  status: "active" | "canceled" | "expired" | "past_due" | "trialing";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  isTrial: boolean;
  daysRemaining: number | null;
  billingPeriod: "monthly" | "annual";
}

// ============================================
// ACTIVE WORKOUT
// ============================================

export interface ActiveWorkout {
  workoutId: string;
  currentExerciseIndex: number;
  exerciseLogs: ExerciseLog[];
  skippedExercises: string[]; // IDs dos exercícios pulados
  selectedAlternatives: Record<string, string>; // exerciseId -> alternativeId
  xpEarned: number;
  totalVolume: number;
  completionPercentage: number;
  startTime: Date;
  lastUpdated: Date;
  cardioPreference?: "none" | "before" | "after";
  cardioDuration?: number;
  selectedCardioType?: string;
}

// ============================================
// FRIENDS
// ============================================

export interface FriendsData {
  count: number;
  list: Array<{
    id: string;
    name: string;
    avatar?: string;
    username?: string;
  }>;
}

// ============================================
// METADATA
// ============================================

export interface StudentMetadata {
  lastSync: Date | null;
  isLoading: boolean;
  isInitialized: boolean;
  errors: Record<string, string | null>;
}

// ============================================
// STUDENT DATA COMPLETO
// ============================================

export interface StudentData {
  // === USER INFO ===
  user: UserInfo;

  // === STUDENT INFO ===
  student: StudentInfo;

  // === PROGRESS ===
  progress: UserProgress;

  // === PROFILE ===
  profile: StudentProfileData;

  // === WEIGHT HISTORY ===
  weightHistory: WeightHistoryItem[];
  weightGain?: number | null; // Ganho/perda no último mês

  // === WORKOUTS ===
  units: Unit[]; // Units com workouts
  workoutHistory: WorkoutHistory[]; // Histórico de workouts completados
  personalRecords: PersonalRecord[]; // Recordes pessoais

  // === NUTRITION ===
  dailyNutrition: DailyNutrition; // Nutrição do dia atual
  foodDatabase: FoodItem[]; // Base de dados de alimentos (cache local)

  // === SUBSCRIPTION ===
  subscription: SubscriptionData | null;

  // === GYMS ===
  gymLocations: GymLocation[]; // Academias parceiras
  memberships: StudentGymMembership[]; // Memberships ativas
  dayPasses: DayPass[]; // Diárias compradas

  // === PAYMENTS ===
  payments: StudentPayment[]; // Histórico de pagamentos
  paymentMethods: PaymentMethod[]; // Métodos de pagamento salvos

  // === SOCIAL ===
  friends: FriendsData;

  // === WORKOUT PROGRESS (Temporário durante workout) ===
  activeWorkout: ActiveWorkout | null;

  // === METADATA ===
  metadata: StudentMetadata;
}

// ============================================
// DADOS INICIAIS
// ============================================

export const initialStudentData: StudentData = {
  user: {
    id: "",
    name: "",
    email: "",
    username: "",
    memberSince: "",
    role: "STUDENT",
    isAdmin: false,
  },
  student: {
    id: "",
  },
  progress: {
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    currentLevel: 1,
    xpToNextLevel: 100,
    workoutsCompleted: 0,
    todayXP: 0,
    achievements: [],
    lastActivityDate: new Date().toISOString(),
    dailyGoalXP: 50,
    weeklyXP: [0, 0, 0, 0, 0, 0, 0],
  },
  profile: {},
  weightHistory: [],
  weightGain: null,
  units: [],
  workoutHistory: [],
  personalRecords: [],
  dailyNutrition: {
    date: new Date().toISOString().split("T")[0],
    meals: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
    waterIntake: 0,
    targetCalories: 2000,
    targetProtein: 150,
    targetCarbs: 250,
    targetFats: 65,
    targetWater: 2000,
  },
  foodDatabase: [],
  subscription: null,
  gymLocations: [],
  memberships: [],
  dayPasses: [],
  payments: [],
  paymentMethods: [],
  friends: {
    count: 0,
    list: [],
  },
  activeWorkout: null,
  metadata: {
    lastSync: null,
    isLoading: false,
    isInitialized: false,
    errors: {},
  },
};

// ============================================
// TIPOS PARA ACTIONS
// ============================================

export type StudentDataSection =
  | "user"
  | "student"
  | "progress"
  | "profile"
  | "weightHistory"
  | "units"
  | "workoutHistory"
  | "personalRecords"
  | "dailyNutrition"
  | "subscription"
  | "memberships"
  | "payments"
  | "paymentMethods"
  | "dayPasses"
  | "friends"
  | "gymLocations";

export interface WorkoutCompletionData {
  workoutId: string;
  duration: number;
  totalVolume?: number;
  exercises: ExerciseLog[];
  overallFeedback?: "excelente" | "bom" | "regular" | "ruim";
  bodyPartsFatigued?: string[];
  cardioData?: {
    duration: number;
    calories: number;
    heartRate?: number;
  };
}

