import { create } from "zustand";
import { actionClient as apiClient } from "@/lib/actions/client";
import type { ExerciseLog, WorkoutSession } from "@/lib/types";

interface WorkoutProgress {
  workoutId: string;
  currentExerciseIndex: number;
  exerciseLogs: ExerciseLog[];
  skippedExercises: string[];
  skippedExerciseIndices: number[];
  selectedAlternatives: Record<string, string>;
  xpEarned: number;
  totalVolume: number;
  completionPercentage: number;
  startTime: Date;
  lastUpdated: Date;
  cardioPreference?: "none" | "before" | "after";
  cardioDuration?: number;
  selectedCardioType?: string;
}

interface WorkoutState {
  activeWorkout: WorkoutProgress | null;
  workoutProgress: Record<string, WorkoutProgress>;
  completedWorkouts: Set<string>;
  openWorkoutId: string | null;
  setActiveWorkout: (workout: WorkoutSession | null) => void;
  setCurrentExerciseIndex: (index: number) => void;
  addExerciseLog: (log: ExerciseLog) => void;
  updateExerciseLog: (
    exerciseId: string,
    updates: Partial<ExerciseLog>,
  ) => void;
  saveWorkoutProgress: (workoutId: string) => Promise<void>;
  loadWorkoutProgress: (workoutId: string) => WorkoutProgress | null;
  clearWorkoutProgress: (workoutId: string) => void;
  completeWorkout: (workoutId: string) => Promise<void>;
  isWorkoutCompleted: (workoutId: string) => boolean;
  isWorkoutInProgress: (workoutId: string) => boolean;
  getWorkoutProgress: (workoutId: string) => number;
  openWorkout: (workoutId: string | null) => void;
  skipExercise: (exerciseId: string, exerciseIndex: number) => void;
  calculateWorkoutStats: () => void;
  selectAlternative: (exerciseId: string, alternativeId?: string) => void;
  setCardioPreference: (
    preference: "none" | "before" | "after",
    duration?: number,
  ) => void;
}

export const useWorkoutStore = create<WorkoutState>()((set, get) => ({
  activeWorkout: null,
  workoutProgress: {},
  completedWorkouts: new Set<string>(),
  openWorkoutId: null,

  setActiveWorkout: (workout) =>
    set((state) => {
      if (!workout && !state.activeWorkout) return state;
      if (workout && state.activeWorkout?.workoutId === workout.id)
        return state;
      return {
        activeWorkout: workout
          ? {
              workoutId: workout.id,
              currentExerciseIndex: 0,
              exerciseLogs: [],
              skippedExercises: [],
              skippedExerciseIndices: [],
              selectedAlternatives: {},
              xpEarned: 0,
              totalVolume: 0,
              completionPercentage: 0,
              startTime: new Date(),
              lastUpdated: new Date(),
              cardioPreference: undefined,
              cardioDuration: undefined,
              selectedCardioType: undefined,
            }
          : null,
      };
    }),

  setCurrentExerciseIndex: (index) =>
    set((state) => {
      if (!state.activeWorkout) return state;
      return {
        activeWorkout: {
          ...state.activeWorkout,
          currentExerciseIndex: index,
          lastUpdated: new Date(),
        },
      };
    }),

  addExerciseLog: (log) =>
    set((state) => {
      if (!state.activeWorkout) return state;
      const newLogs = [...state.activeWorkout.exerciseLogs, log];
      const exerciseVolume = log.sets
        .filter((set) => set.weight > 0 && set.reps > 0)
        .reduce((acc, set) => acc + set.weight * set.reps, 0);
      return {
        activeWorkout: {
          ...state.activeWorkout,
          exerciseLogs: newLogs,
          totalVolume: state.activeWorkout.totalVolume + exerciseVolume,
          lastUpdated: new Date(),
        },
      };
    }),

  updateExerciseLog: (exerciseId, updates) =>
    set((state) => {
      if (!state.activeWorkout) return state;
      const updatedLogs = state.activeWorkout.exerciseLogs.map((log) =>
        log.exerciseId === exerciseId ? { ...log, ...updates } : log,
      );
      const totalVolume = updatedLogs.reduce(
        (acc, log) =>
          acc +
          (log.sets || [])
            .filter((set) => set.weight > 0 && set.reps > 0)
            .reduce((setAcc, set) => setAcc + set.weight * set.reps, 0),
        0,
      );
      return {
        activeWorkout: {
          ...state.activeWorkout,
          exerciseLogs: updatedLogs,
          totalVolume,
          lastUpdated: new Date(),
        },
      };
    }),

  saveWorkoutProgress: async (workoutId) => {
    const state = get();
    if (!state.activeWorkout || state.activeWorkout.workoutId !== workoutId)
      return;

    const progressToSave: WorkoutProgress = {
      workoutId: state.activeWorkout.workoutId,
      currentExerciseIndex: state.activeWorkout.currentExerciseIndex,
      exerciseLogs: state.activeWorkout.exerciseLogs || [],
      skippedExercises: state.activeWorkout.skippedExercises || [],
      skippedExerciseIndices: state.activeWorkout.skippedExerciseIndices || [],
      selectedAlternatives: state.activeWorkout.selectedAlternatives || {},
      xpEarned: state.activeWorkout.xpEarned || 0,
      totalVolume: state.activeWorkout.totalVolume || 0,
      completionPercentage: state.activeWorkout.completionPercentage || 0,
      startTime: state.activeWorkout.startTime,
      lastUpdated: new Date(),
      cardioPreference: state.activeWorkout.cardioPreference,
      cardioDuration: state.activeWorkout.cardioDuration,
      selectedCardioType: state.activeWorkout.selectedCardioType,
    };

    // Atualizar estado em memória
    set({
      workoutProgress: {
        ...state.workoutProgress,
        [workoutId]: progressToSave,
      },
    });

    // Sincronizar com backend (fonte de verdade)
    try {
      const transformedExerciseLogs = progressToSave.exerciseLogs.map(
        (log) => ({
          exerciseId: log.exerciseId,
          exerciseName: log.exerciseName,
          sets:
            log.sets?.map((set) => ({
              weight: set.weight ?? null,
              reps: set.reps ?? null,
              completed: set.completed ?? false,
              notes: set.notes ?? null,
            })) ?? [],
          notes: log.notes ?? null,
          formCheckScore: log.formCheckScore ?? null,
          difficulty: log.difficulty
            ? (log.difficulty.replace("-", "_").replace("ideal", "medio") as
                | "muito_facil"
                | "facil"
                | "medio"
                | "dificil"
                | "muito_dificil")
            : null,
        }),
      );

      await apiClient.post(`/api/workouts/${workoutId}/progress`, {
        currentExerciseIndex: progressToSave.currentExerciseIndex,
        exerciseLogs: transformedExerciseLogs,
        skippedExercises: progressToSave.skippedExercises,
        selectedAlternatives: progressToSave.selectedAlternatives,
        xpEarned: progressToSave.xpEarned,
        totalVolume: progressToSave.totalVolume,
        completionPercentage: progressToSave.completionPercentage,
        startTime:
          progressToSave.startTime instanceof Date
            ? progressToSave.startTime.toISOString()
            : typeof progressToSave.startTime === "string"
              ? progressToSave.startTime
              : progressToSave.startTime
                ? new Date(progressToSave.startTime).toISOString()
                : null,
        cardioPreference: progressToSave.cardioPreference ?? null,
        cardioDuration: progressToSave.cardioDuration ?? null,
        selectedCardioType: progressToSave.selectedCardioType ?? null,
      });
    } catch (error) {
      console.error("Erro ao sincronizar progresso com backend:", error);
    }
  },

  loadWorkoutProgress: (workoutId) => {
    const state = get();
    return state.workoutProgress[workoutId] || null;
  },

  clearWorkoutProgress: (workoutId) =>
    set((state) => {
      const newProgress = { ...state.workoutProgress };
      delete newProgress[workoutId];
      return { workoutProgress: newProgress };
    }),

  completeWorkout: async (workoutId) => {
    const state = get();
    const newCompleted = new Set(state.completedWorkouts);
    newCompleted.add(workoutId);
    set({ activeWorkout: null, completedWorkouts: newCompleted });

    apiClient
      .delete(`/api/workouts/${workoutId}/progress`, { timeout: 5000 })
      .catch((error: Error) => {
        const err = error as {
          response?: { status?: number; data?: { code?: string } };
          code?: string;
          message?: string;
        };
        if (err.response?.status !== 404) {
          console.error("Erro ao limpar progresso parcial:", error);
        }
      });
  },

  isWorkoutCompleted: (workoutId) => {
    const state = get();
    return state.completedWorkouts.has(workoutId);
  },

  isWorkoutInProgress: (workoutId) => {
    const state = get();
    const progress = state.workoutProgress[workoutId];
    if (!progress) return false;
    const hasLogs = progress.exerciseLogs.length > 0;
    const hasSkipped =
      progress.skippedExercises && progress.skippedExercises.length > 0;
    return hasLogs || hasSkipped;
  },

  getWorkoutProgress: (workoutId) => {
    const state = get();
    const progress = state.workoutProgress[workoutId];
    if (!progress) return 0;
    return (
      (progress.exerciseLogs.length || 0) +
      (progress.skippedExercises?.length || 0)
    );
  },

  openWorkout: (workoutId) => set({ openWorkoutId: workoutId }),

  skipExercise: (exerciseId, exerciseIndex) =>
    set((state) => {
      if (!state.activeWorkout) return state;
      const skipped = [...state.activeWorkout.skippedExercises];
      if (!skipped.includes(exerciseId)) skipped.push(exerciseId);
      const skippedIndices = [
        ...(state.activeWorkout.skippedExerciseIndices ?? []),
      ];
      if (!skippedIndices.includes(exerciseIndex))
        skippedIndices.push(exerciseIndex);
      return {
        activeWorkout: {
          ...state.activeWorkout,
          skippedExercises: skipped,
          skippedExerciseIndices: skippedIndices,
          lastUpdated: new Date(),
        },
      };
    }),

  calculateWorkoutStats: () =>
    set((state) => {
      if (!state.activeWorkout) return state;
      const { exerciseLogs } = state.activeWorkout;
      const totalVolume = exerciseLogs.reduce(
        (acc, log) =>
          acc +
          log.sets
            .filter((set) => set.weight > 0 && set.reps > 0)
            .reduce((setAcc, set) => setAcc + set.weight * set.reps, 0),
        0,
      );
      return {
        activeWorkout: {
          ...state.activeWorkout,
          totalVolume,
          xpEarned: state.activeWorkout.xpEarned,
          completionPercentage: 0,
          lastUpdated: new Date(),
        },
      };
    }),

  selectAlternative: (exerciseId, alternativeId) =>
    set((state) => {
      if (!state.activeWorkout) return state;
      const newAlternatives = { ...state.activeWorkout.selectedAlternatives };
      if (alternativeId) {
        newAlternatives[exerciseId] = alternativeId;
      } else {
        delete newAlternatives[exerciseId];
      }
      return {
        activeWorkout: {
          ...state.activeWorkout,
          selectedAlternatives: newAlternatives,
          lastUpdated: new Date(),
        },
      };
    }),

  setCardioPreference: (preference, duration) =>
    set((state) => {
      if (!state.activeWorkout) return state;
      const cardioTypes = ["corrida", "bicicleta", "eliptico", "pular-corda"];
      const selectedCardio =
        state.activeWorkout.selectedCardioType ||
        cardioTypes[Math.floor(Math.random() * cardioTypes.length)];
      return {
        activeWorkout: {
          ...state.activeWorkout,
          cardioPreference: preference,
          cardioDuration: duration,
          selectedCardioType: selectedCardio,
          lastUpdated: new Date(),
        },
      };
    }),
}));
