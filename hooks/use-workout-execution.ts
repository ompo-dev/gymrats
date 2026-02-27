"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { useShallow } from "zustand/react/shallow";
import { useWorkoutStore } from "@/stores";
import { useStudent } from "@/hooks/use-student";
import type { 
  ExerciseLog, 
  WorkoutSession, 
  WorkoutExercise,
  AlternativeExercise,
  MuscleGroup
} from "@/lib/types";
import { useModalStateWithParam, useSubModalState } from "@/hooks/use-modal-state";

/**
 * Hook to manage the execution state and logic of a workout
 */
export function useWorkoutExecution() {
  const _router = useRouter();
  const workoutModal = useModalStateWithParam("workout", "workoutId");
  const openWorkoutId = workoutModal.paramValue;
  const [exerciseIndexParam, setExerciseIndexParam] = useQueryState(
    "exerciseIndex",
    parseAsInteger,
  );
  
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  
  // Use stable selectors for student hooks to avoid unnecessary re-renders
  const units = useStudent("units");
  const weeklyPlan = useStudent("weeklyPlan");
  const studentActions = useStudent("actions");
  const completeStudentWorkout = studentActions?.completeWorkout;
  
  // Use useShallow for stable store actions
  const workoutActions = useWorkoutStore(
    useShallow((state) => ({
      setActiveWorkout: state.setActiveWorkout,
      setCurrentExerciseIndex: state.setCurrentExerciseIndex,
      addExerciseLog: state.addExerciseLog,
      saveWorkoutProgress: state.saveWorkoutProgress,
      loadWorkoutProgress: state.loadWorkoutProgress,
      completeWorkout: state.completeWorkout,
      calculateWorkoutStats: state.calculateWorkoutStats,
      isWorkoutCompleted: state.isWorkoutCompleted,
      skipExercise: state.skipExercise,
      selectAlternative: state.selectAlternative,
    }))
  );

  const {
    setActiveWorkout,
    setCurrentExerciseIndex,
    addExerciseLog,
    saveWorkoutProgress,
    loadWorkoutProgress,
    completeWorkout,
    calculateWorkoutStats,
    isWorkoutCompleted,
    skipExercise,
    selectAlternative,
  } = workoutActions;

  // Cardio state
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [calories, setCalories] = useState(0);
  const [heartRate, setHeartRate] = useState(120);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [showCompletion, setShowCompletion] = useState(false);
  const [completedWorkoutData, setCompletedWorkoutData] = useState<{
    exerciseLogs: ExerciseLog[];
    xpEarned: number;
    totalTime?: number;
    totalCalories?: number;
    avgHeartRate?: number;
    skippedExercises?: string[];
  } | null>(null);

  const weightTrackerModal = useSubModalState("weight-tracker");
  const alternativeSelectorModal = useSubModalState("alternative-selector");
  const cardioConfigModal = useSubModalState("cardio-config");
  const cardioConfigInitialized = useRef(false);
  const lastInitializedKey = useRef<string | null>(null);
  const lastOpenWorkoutIdRef = useRef<string | null>(null);

  // Helper to find workout em units OU weeklyPlan - memoized
  const findWorkout = useCallback(
    (workoutId: string | null): WorkoutSession | null => {
      if (!workoutId) return null;
      // 1. Buscar em units
      if (units && Array.isArray(units) && units.length > 0) {
        for (const unit of units) {
          const workout = unit.workouts.find((w: WorkoutSession) => w.id === workoutId);
          if (workout) return workout;
        }
      }
      // 2. Buscar em weeklyPlan.slots
      if (weeklyPlan?.slots && Array.isArray(weeklyPlan.slots)) {
        for (const slot of weeklyPlan.slots) {
          if (slot.type === "workout" && slot.workout?.id === workoutId) {
            return slot.workout;
          }
        }
      }
      return null;
    },
    [units, weeklyPlan],
  );

  const workoutBase = useMemo(() =>
    openWorkoutId ? findWorkout(openWorkoutId) : null,
  [openWorkoutId, findWorkout]);

  // Workout derivation (Cardio injection) - MUST be memoized to avoid infinite loops
  const workout = useMemo(() => {
    if (!workoutBase) return null;
    
    if (!activeWorkout?.cardioPreference || activeWorkout.cardioPreference === "none") {
      return workoutBase;
    }
    
    const cardioExercises = createCardioExercises(
      activeWorkout.cardioDuration || 10, 
      activeWorkout.selectedCardioType
    );
    
    return {
      ...workoutBase,
      exercises: activeWorkout.cardioPreference === "before" 
        ? [...cardioExercises, ...workoutBase.exercises] 
        : [...workoutBase.exercises, ...cardioExercises],
    };
  }, [workoutBase, activeWorkout?.cardioPreference, activeWorkout?.cardioDuration, activeWorkout?.selectedCardioType]);

  // Derived Values - stabilize by deriving from memoized workout
  const currentIndex = activeWorkout?.currentExerciseIndex || 0;
  const currentExercise = useMemo(() => 
    (activeWorkout && workout?.exercises) ? workout.exercises[currentIndex] : null,
  [activeWorkout, workout?.exercises, currentIndex]);
  
  const totalExercises = workout?.exercises.length || 0;
  const completedCount = activeWorkout?.exerciseLogs?.length || 0;
  const skippedCount = activeWorkout?.skippedExercises?.length || 0;
  const skippedExercises = activeWorkout?.skippedExercises || [];
  const skippedExerciseIndices = activeWorkout?.skippedExerciseIndices || [];
  
  const totalSeen = Math.max(currentIndex, completedCount + skippedCount);
  const workoutProgress = totalExercises > 0 ? Math.min(100, Math.round((totalSeen / totalExercises) * 100)) : 0;

  // Internal initialization logic - improved guards
  useEffect(() => {
    const init = async () => {
      // 1. Handle closing modal
      if (!openWorkoutId) {
        if (lastInitializedKey.current !== null) {
          lastInitializedKey.current = null;
          lastOpenWorkoutIdRef.current = null;
          setActiveWorkout(null);
          setShowCompletion(false);
        }
        return;
      }

      // 2. Wait for workout data to be available
      if (!workout) return;

      // 3. Ao abrir um NOVO workout, limpar exerciseIndexParam da URL (vem de workout anterior)
      // Garante que sempre abra no primeiro exercício ao clicar em outro node
      const isNewWorkout = lastOpenWorkoutIdRef.current !== openWorkoutId;
      if (isNewWorkout) {
        lastOpenWorkoutIdRef.current = openWorkoutId;
        setExerciseIndexParam(null);
      }

      // 4. Prevent redundant re-initialization
      const initKey = `${openWorkoutId}:${exerciseIndexParam ?? ""}`;
      if (lastInitializedKey.current === initKey) return;
      lastInitializedKey.current = initKey;

      console.log(`[useWorkoutExecution] Initializing workout: ${openWorkoutId}`);

      setShowCompletion(false);
      const savedProgress = loadWorkoutProgress(workout.id);
      const isCompleted = isWorkoutCompleted(workout.id);

      // 5. initialIndex: para workout NOVO usar 0 ou savedProgress; nunca exerciseIndexParam (pode ser de outro workout)
      let initialIndex = 0;
      if (isNewWorkout) {
        initialIndex = savedProgress ? savedProgress.currentExerciseIndex : 0;
      } else if (exerciseIndexParam !== null) {
        initialIndex = Math.max(0, Math.min(exerciseIndexParam, workout.exercises.length - 1));
      } else if (savedProgress) {
        initialIndex = savedProgress.currentExerciseIndex;
      }

      if (savedProgress) {
        // Use setState and extend existing progress to avoid lost data
        useWorkoutStore.setState((state) => ({
          activeWorkout: {
            ...savedProgress,
            ...state.activeWorkout, // Keep current state if any (e.g. cardio pref set in this tick)
            workoutId: workout.id,
            currentExerciseIndex: initialIndex,
            lastUpdated: new Date(),
          },
        }));
        
        if (!cardioConfigInitialized.current && workout.type === "strength" && !savedProgress.cardioPreference && initialIndex === 0 && !isCompleted) {
          cardioConfigModal.open();
        }
      } else {
        // Only set active workout if it's actually different
        const currentActive = useWorkoutStore.getState().activeWorkout;
        if (!currentActive || currentActive.workoutId !== workout.id) {
          setActiveWorkout(workout);
          if (initialIndex > 0) setCurrentExerciseIndex(initialIndex);
        }
        
        if (!cardioConfigInitialized.current && workout.type === "strength") {
          cardioConfigModal.open();
        }
      }
      cardioConfigInitialized.current = true;
    };
    
    init();
  }, [openWorkoutId, workout, exerciseIndexParam, setActiveWorkout, setExerciseIndexParam, loadWorkoutProgress, isWorkoutCompleted, setCurrentExerciseIndex, cardioConfigModal]);

  // Cardio timer
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        setCalories(prev => prev + 5 / 60);
        setHeartRate(prev => {
          const v = Math.random() * 10 - 5;
          return Math.max(100, Math.min(180, prev + v));
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  // Helpers
  const convertExerciseLogsForAPI = useCallback((logs: ExerciseLog[]) => {
    return logs
      .filter((log) => log?.exerciseId && log.exerciseName)
      .map((log) => {
        let difficulty: any = null;
        if (log.difficulty) {
          const normalized = log.difficulty.replace(/-/g, "_");
          difficulty = normalized === "ideal" ? "medio" : normalized;
        }
        return {
          exerciseId: log.exerciseId,
          exerciseName: log.exerciseName,
          sets: log.sets?.map((set) => ({
            weight: set.weight ?? null,
            reps: set.reps ?? null,
            completed: set.completed ?? false,
            notes: set.notes ?? null,
          })) ?? [],
          notes: log.notes ?? null,
          formCheckScore: log.formCheckScore ?? null,
          difficulty: difficulty,
        };
      });
  }, []);

  const handleSaveProgress = useCallback(async (log: ExerciseLog) => {
    const existingLogIndex = activeWorkout?.exerciseLogs.findIndex(
      (l) => l.exerciseId === log.exerciseId,
    );

    if (existingLogIndex !== undefined && existingLogIndex >= 0) {
      const { updateExerciseLog } = useWorkoutStore.getState();
      updateExerciseLog(log.exerciseId, log);
      calculateWorkoutStats();
    } else {
      addExerciseLog(log);
    }

    if (workout) {
      saveWorkoutProgress(workout.id).catch(console.error);
    }
  }, [activeWorkout, workout, addExerciseLog, calculateWorkoutStats, saveWorkoutProgress]);

  const handleExerciseComplete = useCallback(async (log: ExerciseLog) => {
    if (!workout || !activeWorkout) return;

    handleSaveProgress(log);
    weightTrackerModal.close();

    const xpPerExercise = Math.round(workout.xpReward / workout.exercises.length);
    useWorkoutStore.setState({
      activeWorkout: {
        ...activeWorkout,
        xpEarned: (activeWorkout.xpEarned || 0) + xpPerExercise,
      },
    });

    if (activeWorkout.currentExerciseIndex + 1 >= workout.exercises.length) {
      const finalState = useWorkoutStore.getState();
      const finalActiveWorkout = finalState.activeWorkout!;
      const finalLogs = [...(finalActiveWorkout.exerciseLogs || [])];
      if (!finalLogs.some(l => l.id === log.id)) finalLogs.push(log);

      setCompletedWorkoutData({
        exerciseLogs: finalLogs,
        xpEarned: finalActiveWorkout.xpEarned || 0,
        skippedExercises: finalActiveWorkout.skippedExercises || [],
      });

      const { apiClient } = await import("@/lib/api/client");
      const workoutDuration = finalActiveWorkout.startTime
        ? Math.round((Date.now() - new Date(finalActiveWorkout.startTime).getTime()) / 60000)
        : workout.estimatedTime;

      try {
        await apiClient.post(`/api/workouts/${workout.id}/complete`, {
          exerciseLogs: convertExerciseLogsForAPI(finalLogs),
          duration: workoutDuration,
          totalVolume: finalActiveWorkout.totalVolume || 0,
          overallFeedback: "bom",
          xpEarned: finalActiveWorkout.xpEarned || workout.xpReward,
          startTime: new Date(finalActiveWorkout.startTime || Date.now()).toISOString(),
        });
      } catch (err) {
        console.error("[useWorkoutExecution] Erro ao salvar conclusão no servidor:", err);
        // Continua para atualizar UI local; loadWeeklyPlan trará estado real do backend
      }

      if (completeStudentWorkout) {
          await completeStudentWorkout({
              workoutId: workout.id,
              exercises: finalLogs,
              duration: workoutDuration,
              totalVolume: finalActiveWorkout.totalVolume || 0,
              overallFeedback: "bom",
              xpEarned: finalActiveWorkout.xpEarned || workout.xpReward,
          });
      }

      setShowCompletion(true);
      setTimeout(() => completeWorkout(workout.id), 100);
    } else {
      const newIndex = activeWorkout.currentExerciseIndex + 1;
      setCurrentExerciseIndex(newIndex);
      setExerciseIndexParam(newIndex);
      saveWorkoutProgress(workout.id).catch(console.error);
    }
  }, [workout, activeWorkout, handleSaveProgress, weightTrackerModal, setExerciseIndexParam, setCurrentExerciseIndex, saveWorkoutProgress, convertExerciseLogsForAPI, completeStudentWorkout, completeWorkout]);

  const handleFinish = useCallback(async () => {
    if (!activeWorkout || !workout) return;
    calculateWorkoutStats();
    const finalActiveWorkout = useWorkoutStore.getState().activeWorkout!;

    setCompletedWorkoutData({
      exerciseLogs: finalActiveWorkout.exerciseLogs || [],
      xpEarned: finalActiveWorkout.xpEarned || 0,
      skippedExercises: finalActiveWorkout.skippedExercises || [],
    });

    setShowCompletion(true);
    setTimeout(() => completeWorkout(workout.id), 100);
  }, [activeWorkout, workout, calculateWorkoutStats, completeWorkout]);

  const handleSkip = useCallback(async () => {
    if (!activeWorkout || !workout) return;
    if (workout.type === "cardio" || (activeWorkout.currentExerciseIndex === 0 && activeWorkout.cardioPreference === "before")) {
        setIsRunning(false);
        setElapsedTime(0);
        setCalories(0);
    }
    
    if (currentExercise) {
        skipExercise(currentExercise.id, currentIndex);
    }
    const newIndex = activeWorkout.currentExerciseIndex + 1;
    if (newIndex >= workout.exercises.length) {
        handleFinish();
    } else {
        setCurrentExerciseIndex(newIndex);
        setExerciseIndexParam(newIndex);
        saveWorkoutProgress(workout.id).catch(console.error);
    }
  }, [activeWorkout, workout, skipExercise, handleFinish, setCurrentExerciseIndex, setExerciseIndexParam, saveWorkoutProgress]);

  const handleClose = useCallback(async () => {
    if (workout && activeWorkout) {
        await saveWorkoutProgress(workout.id);
    }
    workoutModal.close();
  }, [workout, activeWorkout, saveWorkoutProgress, workoutModal]);

  const handleSelectAlternative = useCallback(async (exerciseId: string, alternativeId?: string) => {
    selectAlternative(exerciseId, alternativeId);
    alternativeSelectorModal.close();
    if (workout) {
      saveWorkoutProgress(workout.id).catch(console.error);
    }
  }, [workout, selectAlternative, alternativeSelectorModal, saveWorkoutProgress]);

  return {
    workout,
    activeWorkout,
    currentIndex,
    currentExercise,
    totalExercises,
    workoutProgress,
    skippedExercises,
    skippedExerciseIndices,
    showCompletion,
    completedWorkoutData,
    cardioState: { isRunning, elapsedTime, calories, heartRate, setIsRunning, setElapsedTime, setCalories },
    modals: { workoutModal, weightTrackerModal, alternativeSelectorModal, cardioConfigModal },
    handlers: {
        handleSaveProgress,
        handleExerciseComplete,
        handleFinish,
        handleSkip,
        handleClose,
        handleSelectAlternative,
        handleViewEducation: (exerciseId?: string) => {
            const ex = exerciseId ? workout?.exercises.find(e => e.id === exerciseId) : currentExercise;
            if (ex) {
                const slug = ex.educationSlug || ex.name.toLowerCase().replace(/\s+/g, "-");
                window.location.href = `/student/education/${slug}`;
            }
        }
    },
    actions: {
        setActiveWorkout,
        setCurrentExerciseIndex,
        setExerciseIndexParam,
        setShowCompletion,
        setCompletedWorkoutData,
        selectAlternative,
        saveWorkoutProgress,
        completeWorkout,
        skipExercise,
        calculateWorkoutStats,
        setCardioPreference: (pref: "before" | "after" | "none", duration?: number) => {
            const { setCardioPreference: storeSetCardioPref } = useWorkoutStore.getState();
            storeSetCardioPref(pref, duration);
        }
    },
    methods: {
        getCurrentExerciseName: () => {
            if (!currentExercise || !activeWorkout) return "";
            const altId = activeWorkout.selectedAlternatives?.[currentExercise.id];
            if (altId && currentExercise.alternatives) {
                const alt = currentExercise.alternatives.find((a: AlternativeExercise) => a.id === altId);
                return alt?.name || currentExercise.name;
            }
            return currentExercise.name;
        },
        isCurrentExerciseCardio: () => {
             return workout?.type === "cardio" || currentExercise?.id?.startsWith("cardio-") || currentExercise?.name?.toLowerCase().includes("cardio");
        },
        isCurrentExerciseUnilateral: () => {
          if (!currentExercise) return false;
          const nameLower = currentExercise.name.toLowerCase();
          return (
            nameLower.includes("unilateral") ||
            nameLower.includes("pistol") ||
            nameLower.includes("single-leg") ||
            nameLower.includes("single-arm")
          );
        },
        getCurrentExerciseLog: () => {
          if (!activeWorkout || !currentExercise) return null;
          return activeWorkout.exerciseLogs?.find(
            (log) => log != null && log.exerciseId === currentExercise.id,
          ) ?? null;
        }
    }
  };
}

function createCardioExercises(duration: number, type?: string): WorkoutExercise[] {
    const cardioTypes: any = {
        corrida: { name: "Corrida na Esteira", icon: "🏃", alternatives: [
            { id: "alt-corrida-rua", name: "Corrida ao Ar Livre", reason: "Sem esteira disponível" },
            { id: "alt-corrida-bike", name: "Bicicleta", reason: "Menor impacto nas articulações" }
        ] },
        bicicleta: { name: "Bicicleta Ergométrica", icon: "🚴", alternatives: [
            { id: "alt-bike-remo", name: "Remo Ergométrico", reason: "Trabalha mais grupos musculares" },
            { id: "alt-bike-eliptico", name: "Elíptico", reason: "Menor impacto nas articulações" }
        ] },
        eliptico: { name: "Elíptico", icon: "🎯", alternatives: [
            { id: "alt-eliptico-bike", name: "Bicicleta", reason: "Equipamento ocupado" },
            { id: "alt-eliptico-stair", name: "Escada Ergométrica", reason: "Maior intensidade" }
        ] },
        "pular-corda": { name: "Pular Corda", icon: "🪢", alternatives: [
            { id: "alt-corda-jumping", name: "Jumping Jacks", reason: "Sem corda disponível" },
            { id: "alt-corda-burpees", name: "Burpees", reason: "Maior intensidade" }
        ] }
    };
    const selected = cardioTypes[type || "corrida"] || cardioTypes.corrida;
    return [{
        id: `cardio-${type || "corrida"}`,
        name: `${selected.icon} ${selected.name}`,
        sets: 1,
        reps: `${duration} minutos`,
        rest: 0,
        completed: false,
        notes: `Mantenha uma intensidade moderada. Meta: ${duration} minutos contínuos.`,
        alternatives: selected.alternatives,
    }];
}
