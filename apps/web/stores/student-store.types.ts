/**
 * Tipos do student-unified-store.
 * Separado para permitir importação por slices sem dependência circular.
 */

import type { DailyNutrition, PersonalRecord, UserProgress } from "@/lib/types";
import type {
  StudentData,
  StudentDataSection,
  WorkoutCompletionData,
} from "@/lib/types/student-unified";

export interface StudentUnifiedState {
  data: StudentData;
  loadAll: () => Promise<void>;
  loadAllPrioritized: (
    priorities: StudentDataSection[],
    onlyPriorities?: boolean,
  ) => Promise<void>;
  loadEssential: () => Promise<void>;
  loadStudentCore: () => Promise<void>;
  loadWorkouts: (force?: boolean) => Promise<void>;
  loadWeeklyPlan: (force?: boolean) => Promise<void>;
  loadNutrition: () => Promise<void>;
  loadFinancial: () => Promise<void>;
  loadUser: () => Promise<void>;
  loadProgress: () => Promise<void>;
  loadProfile: () => Promise<void>;
  loadWeightHistory: () => Promise<void>;
  loadWorkoutHistory: () => Promise<void>;
  loadPersonalRecords: () => Promise<void>;
  loadSubscription: () => Promise<void>;
  loadMemberships: () => Promise<void>;
  loadPayments: () => Promise<void>;
  loadPaymentMethods: () => Promise<void>;
  loadDayPasses: () => Promise<void>;
  loadFriends: () => Promise<void>;
  loadGymLocations: () => Promise<void>;
  loadGymLocationsWithPosition: (lat: number, lng: number) => Promise<void>;
  loadFoodDatabase: () => Promise<void>;
  updateProgress: (progress: Partial<UserProgress>) => Promise<void>;
  updateProfile: (profile: Partial<StudentData["profile"]>) => Promise<void>;
  addWeight: (weight: number, date?: Date, notes?: string) => Promise<void>;
  completeWorkout: (data: WorkoutCompletionData) => Promise<void>;
  addPersonalRecord: (record: PersonalRecord) => void;
  updateNutrition: (nutrition: Partial<DailyNutrition>) => Promise<void>;
  updateSubscription: (
    subscription: Partial<StudentData["subscription"]> | null,
  ) => Promise<void>;
  addDayPass: (dayPass: StudentData["dayPasses"][0]) => void;
  createUnit: (data: { title: string; description?: string }) => Promise<void>;
  updateUnit: (
    unitId: string,
    data: { title?: string; description?: string },
  ) => Promise<void>;
  deleteUnit: (unitId: string) => Promise<void>;
  createWorkout: (data: {
    unitId: string;
    title: string;
    description?: string;
    muscleGroup?: string;
    difficulty?: string;
    estimatedTime?: number;
    type?: string;
  }) => Promise<string>;
  updateWorkout: (
    workoutId: string,
    data: Partial<Record<string, string | number | boolean | object | null>>,
  ) => Promise<void>;
  deleteWorkout: (workoutId: string) => Promise<void>;
  addWorkoutExercise: (
    workoutId: string,
    data: Record<string, string | number | boolean | object | null>,
  ) => Promise<void>;
  updateWorkoutExercise: (
    exerciseId: string,
    data: Partial<import("@/lib/types").WorkoutExercise>,
  ) => Promise<void>;
  deleteWorkoutExercise: (exerciseId: string) => Promise<void>;
  setActiveWorkout: (workoutId: string | null) => void;
  updateActiveWorkout: (updates: Partial<StudentData["activeWorkout"]>) => void;
  saveWorkoutProgress: (workoutId: string) => void;
  clearActiveWorkout: () => void;
  syncAll: () => Promise<void>;
  syncProgress: () => Promise<void>;
  syncNutrition: () => Promise<void>;
  syncPendingActions: () => Promise<void>;
  reset: () => void;
  clearCache: () => void;
}
