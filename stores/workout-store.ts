import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WorkoutSession, ExerciseLog, SetLog } from "@/lib/types";

interface WorkoutProgress {
  workoutId: string;
  currentExerciseIndex: number;
  exerciseLogs: ExerciseLog[];
  skippedExercises: string[]; // IDs dos exercícios pulados
  selectedAlternatives: Record<string, string>; // exerciseId -> alternativeId
  xpEarned: number; // XP total ganho no workout
  totalVolume: number; // Volume total em kg
  completionPercentage: number; // Porcentagem de conclusão
  startTime: Date;
  lastUpdated: Date;
  cardioPreference?: "none" | "before" | "after"; // Preferência de cardio
  cardioDuration?: number; // Duração do cardio em minutos (5, 10, 15, 20)
  selectedCardioType?: string; // Tipo de cardio selecionado (para manter consistente)
}

interface WorkoutState {
  activeWorkout: WorkoutProgress | null;
  workoutProgress: Record<string, WorkoutProgress>;
  completedWorkouts: Set<string>; // IDs dos workouts completados
  openWorkoutId: string | null; // ID do workout aberto no modal
  setActiveWorkout: (workout: WorkoutSession | null) => void;
  setCurrentExerciseIndex: (index: number) => void;
  addExerciseLog: (log: ExerciseLog) => void;
  updateExerciseLog: (
    exerciseId: string,
    updates: Partial<ExerciseLog>
  ) => void;
  saveWorkoutProgress: (workoutId: string) => void;
  loadWorkoutProgress: (workoutId: string) => WorkoutProgress | null;
  clearWorkoutProgress: (workoutId: string) => void;
  completeWorkout: (workoutId: string) => void;
  isWorkoutCompleted: (workoutId: string) => boolean;
  isWorkoutInProgress: (workoutId: string) => boolean;
  getWorkoutProgress: (workoutId: string) => number; // Retorna % de progresso (0-100)
  openWorkout: (workoutId: string | null) => void; // Abrir/fechar modal
  skipExercise: (exerciseId: string) => void; // Marcar exercício como pulado
  calculateWorkoutStats: () => void; // Calcular estatísticas do workout (XP, volume, %)
  selectAlternative: (exerciseId: string, alternativeId?: string) => void; // Selecionar alternativa
  setCardioPreference: (
    preference: "none" | "before" | "after",
    duration?: number
  ) => void; // Definir preferência de cardio
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      activeWorkout: null,
      workoutProgress: {},
      completedWorkouts: new Set<string>(),
      openWorkoutId: null,
      setActiveWorkout: (workout) =>
        set({
          activeWorkout: workout
            ? {
                workoutId: workout.id,
                currentExerciseIndex: 0,
                exerciseLogs: [],
                skippedExercises: [],
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
          // Calcular volume do exercício (apenas séries válidas com peso > 0 e reps > 0)
          const exerciseVolume = log.sets
            .filter((set) => set.weight > 0 && set.reps > 0)
            .reduce((acc, set) => acc + set.weight * set.reps, 0);
          // Calcular XP do exercício (assumindo XP igual por exercício)
          // Isso será ajustado quando calcularmos as estatísticas
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
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exerciseLogs: state.activeWorkout.exerciseLogs.map((log) =>
                log.exerciseId === exerciseId ? { ...log, ...updates } : log
              ),
              lastUpdated: new Date(),
            },
          };
        }),
      saveWorkoutProgress: (workoutId) =>
        set((state) => {
          if (
            !state.activeWorkout ||
            state.activeWorkout.workoutId !== workoutId
          )
            return state;
          // Salva sempre, mesmo sem logs (para rastrear índice atual, exercícios pulados, etc)
          // Garantir que todas as propriedades estejam presentes
          const progressToSave: WorkoutProgress = {
            workoutId: state.activeWorkout.workoutId,
            currentExerciseIndex: state.activeWorkout.currentExerciseIndex,
            exerciseLogs: state.activeWorkout.exerciseLogs || [],
            skippedExercises: state.activeWorkout.skippedExercises || [],
            selectedAlternatives:
              state.activeWorkout.selectedAlternatives || {},
            xpEarned: state.activeWorkout.xpEarned || 0,
            totalVolume: state.activeWorkout.totalVolume || 0,
            completionPercentage: state.activeWorkout.completionPercentage || 0,
            startTime: state.activeWorkout.startTime,
            lastUpdated: new Date(),
            cardioPreference: state.activeWorkout.cardioPreference,
            cardioDuration: state.activeWorkout.cardioDuration,
            selectedCardioType: state.activeWorkout.selectedCardioType,
          };
          return {
            workoutProgress: {
              ...state.workoutProgress,
              [workoutId]: progressToSave,
            },
          };
        }),
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
      completeWorkout: (workoutId) =>
        set((state) => {
          // Marcar como completo mas manter o progresso para permitir reabrir
          const newCompleted = new Set(state.completedWorkouts);
          newCompleted.add(workoutId);
          return {
            activeWorkout: null,
            // NÃO remover do workoutProgress - permite reabrir e fazer novamente
            completedWorkouts: newCompleted,
          };
        }),
      isWorkoutCompleted: (workoutId) => {
        const state = get();
        return state.completedWorkouts.has(workoutId);
      },
      isWorkoutInProgress: (workoutId) => {
        const state = get();
        const progress = state.workoutProgress[workoutId];
        if (!progress) return false;
        // Considera em progresso se houver logs OU exercícios pulados
        const hasLogs = progress.exerciseLogs.length > 0;
        const hasSkipped =
          progress.skippedExercises && progress.skippedExercises.length > 0;
        return hasLogs || hasSkipped;
      },
      getWorkoutProgress: (workoutId) => {
        const state = get();
        const progress = state.workoutProgress[workoutId];
        if (!progress) return 0;
        // Retorna o número total de exercícios vistos (completados + pulados)
        const completedCount = progress.exerciseLogs.length || 0;
        const skippedCount = progress.skippedExercises?.length || 0;
        return completedCount + skippedCount;
      },
      openWorkout: (workoutId) => set({ openWorkoutId: workoutId }),
      skipExercise: (exerciseId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const skipped = [...state.activeWorkout.skippedExercises];
          if (!skipped.includes(exerciseId)) {
            skipped.push(exerciseId);
          }
          return {
            activeWorkout: {
              ...state.activeWorkout,
              skippedExercises: skipped,
              lastUpdated: new Date(),
            },
          };
        }),
      calculateWorkoutStats: () =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const { exerciseLogs, skippedExercises, workoutId } =
            state.activeWorkout;

          // Calcular volume total apenas de séries válidas (peso > 0 e reps > 0)
          const totalVolume = exerciseLogs.reduce(
            (acc, log) =>
              acc +
              log.sets
                .filter((set) => set.weight > 0 && set.reps > 0)
                .reduce((setAcc, set) => setAcc + set.weight * set.reps, 0),
            0
          );

          // Calcular XP (assumindo que cada exercício completo dá XP igual)
          // Isso pode ser ajustado depois com base no workout.xpReward
          const completedCount = exerciseLogs.length;
          const skippedCount = skippedExercises.length;
          const totalExercises = completedCount + skippedCount;

          // Porcentagem de conclusão baseada em exercícios processados
          // Isso será calculado no componente com base no workout.exercises.length
          const completionPercentage = 0; // Será calculado no componente

          return {
            activeWorkout: {
              ...state.activeWorkout,
              totalVolume,
              xpEarned: state.activeWorkout.xpEarned, // Será calculado no componente
              completionPercentage,
              lastUpdated: new Date(),
            },
          };
        }),
      selectAlternative: (exerciseId, alternativeId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const newAlternatives = {
            ...state.activeWorkout.selectedAlternatives,
          };
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

          // Se já tem um cardio selecionado, manter. Senão, gerar novo
          const cardioTypes = [
            "corrida",
            "bicicleta",
            "eliptico",
            "pular-corda",
          ];
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
    }),
    {
      name: "workout-storage",
      partialize: (state) => ({
        ...state,
        completedWorkouts: Array.from(state.completedWorkouts),
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        completedWorkouts: persistedState?.completedWorkouts
          ? new Set(persistedState.completedWorkouts)
          : new Set<string>(),
      }),
    }
  )
);
