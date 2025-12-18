"use client";

import { useState, useEffect, useRef } from "react";
import { mockWorkouts } from "@/lib/mock-data";
import { BookOpen } from "lucide-react";
import { WeightTracker } from "@/components/weight-tracker";
import { ExerciseAlternativeSelector } from "@/components/exercise-alternative-selector";
import { WorkoutHeader } from "@/components/workout/workout-header";
import { CardioExerciseView } from "@/components/workout/cardio-exercise-view";
import { StrengthExerciseView } from "@/components/workout/strength-exercise-view";
import { WorkoutActions } from "@/components/workout/workout-actions";
import { WorkoutCompletionScreen } from "@/components/workout/workout-completion-screen";
import type { ExerciseLog } from "@/lib/types";
import { motion, AnimatePresence } from "motion/react";
import { useWorkoutStore, useStudentStore, useUIStore } from "@/stores";
import { useRouter } from "next/navigation";

export function WorkoutModal() {
  const router = useRouter();
  const openWorkoutId = useWorkoutStore((state) => state.openWorkoutId);
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);
  const {
    setActiveWorkout,
    setCurrentExerciseIndex,
    addExerciseLog,
    saveWorkoutProgress,
    loadWorkoutProgress,
    completeWorkout,
    clearWorkoutProgress,
    openWorkout,
    skipExercise,
    calculateWorkoutStats,
    isWorkoutCompleted,
    selectAlternative,
  } = useWorkoutStore();
  const { completeWorkout: completeStudentWorkout, addXP } = useStudentStore();
  const { showWeightTracker, setShowWeightTracker } = useUIStore();
  const [showCompletion, setShowCompletion] = useState(false);
  const [showAlternativeSelector, setShowAlternativeSelector] = useState(false);

  // Estados específicos de cardio
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // em segundos
  const [calories, setCalories] = useState(0);
  const [heartRate, setHeartRate] = useState(120);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Salvar dados do workout completado para mostrar na tela de conclusão
  const [completedWorkoutData, setCompletedWorkoutData] = useState<{
    exerciseLogs: ExerciseLog[];
    xpEarned: number;
    totalTime?: number;
    totalCalories?: number;
    avgHeartRate?: number;
  } | null>(null);

  const workout = openWorkoutId
    ? mockWorkouts.find((w) => w.id === openWorkoutId)
    : null;

  // Inicializar workout quando abrir
  useEffect(() => {
    if (!workout || !openWorkoutId) {
      setActiveWorkout(null);
      setShowCompletion(false);
      setShowWeightTracker(false);
      setIsRunning(false);
      setElapsedTime(0);
      setCalories(0);
      return;
    }

    // Sempre resetar tela de conclusão quando abrir
    setShowCompletion(false);
    setShowWeightTracker(false);
    setCompletedWorkoutData(null);
    setIsRunning(false);
    setElapsedTime(0);
    setCalories(0);

    // Carregar progresso salvo primeiro
    const savedProgress = loadWorkoutProgress(workout.id);
    const isCompleted = isWorkoutCompleted(workout.id);

    // Inicializar workout com dados salvos se existirem
    if (savedProgress) {
      // Restaurar workout completo com todos os dados salvos
      // Se o workout estava completo, resetar o índice para o início para permitir refazer
      // Caso contrário, manter o índice salvo para continuar de onde parou
      useWorkoutStore.setState({
        activeWorkout: {
          workoutId: workout.id,
          currentExerciseIndex: isCompleted
            ? 0
            : savedProgress.currentExerciseIndex,
          exerciseLogs: savedProgress.exerciseLogs || [],
          skippedExercises: savedProgress.skippedExercises || [],
          xpEarned: savedProgress.xpEarned || 0,
          totalVolume: savedProgress.totalVolume || 0,
          completionPercentage: savedProgress.completionPercentage || 0,
          startTime: savedProgress.startTime || new Date(),
          lastUpdated: new Date(),
          selectedAlternatives: savedProgress.selectedAlternatives || {},
        },
      });
    } else {
      // Inicializar workout novo
      setActiveWorkout(workout);
    }

    return () => {
      // Limpar cronômetro de cardio
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Ao fechar, salvar progresso sempre (mesmo sem logs, para manter índice e exercícios pulados)
      const currentState = useWorkoutStore.getState();
      if (workout && currentState.activeWorkout) {
        currentState.saveWorkoutProgress(workout.id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openWorkoutId, workout]);

  // Cronômetro para exercícios de cardio
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
        // Simular calorias (5 cal/min em média)
        setCalories((prev) => prev + 5 / 60);
        // Simular variação de FC
        setHeartRate((prev) => {
          const variation = Math.random() * 10 - 5;
          return Math.max(100, Math.min(180, prev + variation));
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Salvar progresso sempre que mudar (incluindo exercícios pulados e mudanças de índice)
  useEffect(() => {
    if (!workout || !activeWorkout) return;
    // Salva sempre, mesmo sem logs (para rastrear índice atual e exercícios pulados)
    saveWorkoutProgress(workout.id);

    // Disparar evento customizado para atualizar outros componentes
    window.dispatchEvent(
      new CustomEvent("workoutProgressUpdate", {
        detail: {
          workoutId: workout.id,
          progress: {
            currentExerciseIndex: activeWorkout.currentExerciseIndex,
            exerciseLogs: activeWorkout.exerciseLogs,
            skippedExercises: activeWorkout.skippedExercises,
            xpEarned: activeWorkout.xpEarned,
            totalVolume: activeWorkout.totalVolume,
            completionPercentage: activeWorkout.completionPercentage,
          },
        },
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    workout?.id,
    activeWorkout?.currentExerciseIndex,
    activeWorkout?.exerciseLogs?.length,
    activeWorkout?.skippedExercises?.length,
    activeWorkout?.xpEarned,
    activeWorkout?.totalVolume,
  ]);

  // Debug: Log workout data - DEVE ficar ANTES dos returns condicionais
  useEffect(() => {
    if (!workout || !activeWorkout) return;
    const currentExercise =
      workout.exercises[activeWorkout.currentExerciseIndex];
    if (currentExercise) {
      console.log("🏋️ Workout Debug:", {
        workoutId: workout.id,
        exerciseName: currentExercise.name,
        hasAlternatives: !!currentExercise.alternatives,
        alternativesLength: currentExercise.alternatives?.length,
        alternatives: currentExercise.alternatives,
        fullExercise: currentExercise,
      });
    }
  }, [workout, activeWorkout, activeWorkout?.currentExerciseIndex]);

  // Não renderizar nada se não houver workout aberto
  // Mas permitir renderizar se estiver mostrando a tela de conclusão
  if (!openWorkoutId || !workout) {
    return null;
  }

  // Se não está mostrando conclusão e não tem activeWorkout, não renderizar
  if (!showCompletion && !activeWorkout) {
    return null;
  }

  // Se está mostrando conclusão, não precisa do currentExercise
  const currentExercise = activeWorkout
    ? workout.exercises[activeWorkout.currentExerciseIndex]
    : null;

  // Obter o nome do exercício considerando alternativa selecionada
  const getCurrentExerciseName = () => {
    if (!currentExercise || !activeWorkout) return "";
    const alternativeId =
      activeWorkout.selectedAlternatives?.[currentExercise.id];
    if (alternativeId && currentExercise.alternatives) {
      const alternative = currentExercise.alternatives.find(
        (alt) => alt.id === alternativeId
      );
      return alternative?.name || currentExercise.name;
    }
    return currentExercise.name;
  };

  // Função para navegar para conteúdo educacional
  const handleViewEducation = (educationalId: string) => {
    // Salvar progresso antes de navegar
    if (workout && activeWorkout) {
      saveWorkoutProgress(workout.id);
    }
    // Fechar modal e navegar
    setShowAlternativeSelector(false);
    openWorkout(null);
    router.push(`/student?tab=education&exercise=${educationalId}`);
  };

  // Função para selecionar alternativa
  const handleSelectAlternative = (
    exerciseId: string,
    alternativeId?: string
  ) => {
    selectAlternative(exerciseId, alternativeId);
    setShowAlternativeSelector(false);
    if (workout) {
      saveWorkoutProgress(workout.id);
    }
  };

  // Verificar se o exercício atual é cardio
  const isCurrentExerciseCardio = () => {
    return (
      workout?.type === "cardio" ||
      currentExercise?.name?.toLowerCase().includes("cardio")
    );
  };

  // Formatar tempo para MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Calcular progresso baseado no índice atual do exercício
  // O progresso deve refletir quantos exercícios já foram vistos (completados ou pulados)
  // Mas também considerar o índice atual para atualizar quando voltar
  const totalExercises = workout.exercises.length;
  const completedCount = activeWorkout?.exerciseLogs?.length || 0;
  const skippedCount = activeWorkout?.skippedExercises?.length || 0;
  const currentIndex = activeWorkout?.currentExerciseIndex || 0;

  // Progresso baseado em exercícios já completados/pulados + o exercício atual
  // Se estou no índice 0, ainda não vi nenhum = 0%
  // Se estou no índice 1, já vi 1 exercício = (1/total) * 100
  // Mas se já completei/pulei mais exercícios, usar o maior valor
  const seenByIndex = currentIndex; // Exercícios vistos até o índice atual
  const seenByLogs = completedCount + skippedCount; // Exercícios realmente completados/pulados
  const totalSeen = Math.max(seenByIndex, seenByLogs);

  const progress =
    totalExercises > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((totalSeen / totalExercises) * 100))
        )
      : 0;
  const hearts = 5;

  const handleExerciseComplete = (log: ExerciseLog) => {
    // Adicionar log do exercício
    addExerciseLog(log);
    setShowWeightTracker(false);

    // Calcular estatísticas atualizadas
    calculateWorkoutStats();

    // Calcular XP ganho neste exercício
    const xpPerExercise = Math.round(
      workout.xpReward / workout.exercises.length
    );
    // Atualizar XP no store
    const currentState = useWorkoutStore.getState();
    if (currentState.activeWorkout) {
      const newXpEarned =
        (currentState.activeWorkout.xpEarned || 0) + xpPerExercise;
      useWorkoutStore.setState({
        activeWorkout: {
          ...currentState.activeWorkout,
          xpEarned: newXpEarned,
        },
      });
    }

    // Salvar progresso
    saveWorkoutProgress(workout.id);

    if (!activeWorkout) return;

    if (activeWorkout.currentExerciseIndex + 1 >= workout.exercises.length) {
      // Obter estado final antes de limpar
      const finalState = useWorkoutStore.getState();
      const finalActiveWorkout = finalState.activeWorkout;

      // Salvar dados para a tela de conclusão ANTES de limpar o activeWorkout
      if (finalActiveWorkout) {
        setCompletedWorkoutData({
          exerciseLogs: finalActiveWorkout.exerciseLogs || [],
          xpEarned: finalActiveWorkout.xpEarned || 0,
        });
      }

      // Adicionar XP
      if (finalActiveWorkout && finalActiveWorkout.xpEarned > 0) {
        addXP(finalActiveWorkout.xpEarned);
      } else {
        addXP(workout.xpReward);
      }

      // Marcar como completo mas manter o progresso para permitir reabrir
      completeWorkout(workout.id);
      completeStudentWorkout(workout.id, workout.xpReward);

      // Disparar evento de conclusão
      window.dispatchEvent(
        new CustomEvent("workoutCompleted", {
          detail: { workoutId: workout.id },
        })
      );

      // Mostrar tela de conclusão
      setShowCompletion(true);
    } else {
      if (activeWorkout) {
        setCurrentExerciseIndex(activeWorkout.currentExerciseIndex + 1);
      }
      // Salvar progresso após avançar
      saveWorkoutProgress(workout.id);
    }
  };

  const handleCardioComplete = () => {
    if (!activeWorkout) return;

    // Pausar cronômetro
    setIsRunning(false);

    // Criar log do exercício de cardio
    const cardioLog: ExerciseLog = {
      exerciseId: currentExercise?.id || "",
      exerciseName: getCurrentExerciseName(),
      sets: [
        {
          set: 1,
          reps: parseInt(currentExercise?.reps || "0"),
          weight: 0,
          completed: true,
        },
      ],
      timestamp: new Date(),
    };

    // Adicionar dados específicos de cardio ao completedWorkoutData se for o último
    if (activeWorkout.currentExerciseIndex + 1 >= workout.exercises.length) {
      setCompletedWorkoutData({
        exerciseLogs: [...(activeWorkout.exerciseLogs || []), cardioLog],
        xpEarned: workout.xpReward,
        totalTime: elapsedTime,
        totalCalories: Math.round(calories),
        avgHeartRate: Math.round(heartRate),
      });
    }

    // Usar a mesma função de conclusão de exercício
    handleExerciseComplete(cardioLog);

    // Resetar contadores para o próximo exercício
    setElapsedTime(0);
    setCalories(0);
    setHeartRate(120);
  };

  const handleSkip = () => {
    if (!activeWorkout) return;

    // Se for cardio, resetar cronômetro
    if (isCurrentExerciseCardio()) {
      setIsRunning(false);
      setElapsedTime(0);
      setCalories(0);
      setHeartRate(120);
    }

    // Marcar exercício atual como pulado
    const currentExerciseId =
      workout.exercises[activeWorkout.currentExerciseIndex].id;
    skipExercise(currentExerciseId);

    // Calcular estatísticas atualizadas
    calculateWorkoutStats();

    // Obter estado atualizado após pular (Zustand atualiza síncronamente)
    const currentState = useWorkoutStore.getState();
    const updatedWorkout = currentState.activeWorkout;

    if (!updatedWorkout) return;

    const totalExercises = workout.exercises.length;
    const completedCount = updatedWorkout.exerciseLogs.length || 0;
    const skippedCount = updatedWorkout.skippedExercises?.length || 0;
    const totalSeen = completedCount + skippedCount;

    // Salvar progresso
    saveWorkoutProgress(workout.id);

    // Verificar se chegou no último exercício
    const isLastExercise =
      updatedWorkout.currentExerciseIndex + 1 >= totalExercises;

    // Se todos os exercícios foram vistos (completados ou pulados), marcar como completo
    if (isLastExercise && totalSeen >= totalExercises) {
      // Salvar dados para a tela de conclusão ANTES de limpar o activeWorkout
      setCompletedWorkoutData({
        exerciseLogs: updatedWorkout.exerciseLogs || [],
        xpEarned: updatedWorkout.xpEarned || 0,
      });

      // Marcar treino como completo
      completeWorkout(workout.id);
      completeStudentWorkout(workout.id, workout.xpReward);

      // Adicionar XP se houver (mesmo que seja 0 se todos foram pulados)
      const xpEarned = updatedWorkout.xpEarned || 0;
      if (xpEarned > 0) {
        addXP(xpEarned);
      }

      // Disparar evento de conclusão
      window.dispatchEvent(
        new CustomEvent("workoutCompleted", {
          detail: { workoutId: workout.id },
        })
      );

      setShowCompletion(true);
    } else if (isLastExercise) {
      // Se chegou no último mas ainda não completou todos, mostrar conclusão mesmo assim
      setShowCompletion(true);
    } else {
      // Avançar para próximo exercício
      setCurrentExerciseIndex(updatedWorkout.currentExerciseIndex + 1);
      // Salvar progresso após avançar
      saveWorkoutProgress(workout.id);
    }
  };

  const handleClose = () => {
    // Salvar progresso antes de fechar (sempre, mesmo sem logs)
    if (workout && activeWorkout) {
      saveWorkoutProgress(workout.id);
    }
    // Fechar modal
    openWorkout(null);
    setShowCompletion(false);
    setShowWeightTracker(false);
  };

  if (showCompletion) {
    // Usar dados salvos ou dados do activeWorkout (se ainda existir)
    const workoutData = completedWorkoutData || {
      exerciseLogs: activeWorkout?.exerciseLogs || [],
      xpEarned: activeWorkout?.xpEarned || 0,
    };

    // Calcular volume total apenas de séries válidas (peso > 0 e reps > 0)
    const totalVolume = workoutData.exerciseLogs.reduce(
      (acc, log) =>
        acc +
        log.sets
          .filter((set) => set.weight > 0 && set.reps > 0)
          .reduce((setAcc, set) => setAcc + set.weight * set.reps, 0),
      0
    );

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-screen w-full max-h-screen flex-col items-center overflow-y-auto bg-linear-to-b from-white to-gray-50 p-4 sm:p-6"
          >
            <FadeIn delay={0.1}>
              <div className="mb-4 sm:mb-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 10,
                    delay: 0.2,
                  }}
                  className="mb-4 sm:mb-6 text-6xl sm:text-8xl"
                >
                  🎉
                </motion.div>
                <h1 className="mb-2 text-2xl sm:text-3xl lg:text-4xl font-black text-[#58CC02]">
                  Treino Completo!
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-duo-gray-dark">
                  Excelente trabalho hoje!
                </p>
              </div>
            </FadeIn>

            <div className="mb-4 sm:mb-8 grid w-full max-w-md grid-cols-2 gap-3 sm:gap-4">
              {/* Se houver dados de cardio, mostrar métricas diferentes */}
              {workoutData.totalTime !== undefined ? (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    className="rounded-2xl border-2 border-duo-blue bg-duo-blue/20 p-4 sm:p-6 text-center shadow-lg"
                  >
                    <Timer className="mx-auto mb-2 h-5 w-5 sm:h-6 sm:w-6 text-duo-blue" />
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                      Tempo Total
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-duo-blue">
                      {formatTime(workoutData.totalTime)}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    className="rounded-2xl border-2 border-duo-orange bg-duo-orange/20 p-4 sm:p-6 text-center shadow-lg"
                  >
                    <Flame className="mx-auto mb-2 h-5 w-5 sm:h-6 sm:w-6 text-duo-orange" />
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                      Calorias
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-duo-orange">
                      {workoutData.totalCalories}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    className="rounded-2xl border-2 border-duo-red bg-duo-red/20 p-4 sm:p-6 text-center shadow-lg"
                  >
                    <Heart className="mx-auto mb-2 h-5 w-5 sm:h-6 sm:w-6 text-duo-red" />
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                      FC Média
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-duo-red">
                      {workoutData.avgHeartRate} bpm
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    className="rounded-2xl border-2 border-[#FFC800] bg-linear-to-br from-[#FFC800]/20 to-[#FF9600]/20 p-4 sm:p-6 text-center shadow-lg"
                  >
                    <Zap className="mx-auto mb-2 h-5 w-5 sm:h-6 sm:w-6 text-[#FFC800]" />
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                      XP Ganho
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#FFC800]">
                      {workout.xpReward}
                    </div>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    className="rounded-2xl border-2 border-[#FFC800] bg-linear-to-br from-[#FFC800]/20 to-[#FF9600]/20 p-4 sm:p-6 text-center shadow-lg"
                  >
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-[#FFC800]" />
                    </div>
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                      XP Ganho
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#FFC800]">
                      {workout.xpReward}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    className="rounded-2xl border-2 border-[#1CB0F6] bg-linear-to-br from-[#1CB0F6]/20 to-[#58CC02]/20 p-4 sm:p-6 text-center shadow-lg"
                  >
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <Weight className="h-5 w-5 sm:h-6 sm:w-6 text-[#1CB0F6]" />
                    </div>
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                      Volume Total
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#1CB0F6]">
                      {totalVolume.toFixed(0)}kg
                    </div>
                  </motion.div>
                </>
              )}
            </div>

            {workoutData.exerciseLogs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="mb-4 sm:mb-6 w-full max-w-md space-y-2 sm:space-y-3"
              >
                <h3 className="text-base sm:text-lg font-bold text-duo-text">
                  Resumo do Treino
                </h3>
                {workoutData.exerciseLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="rounded-xl border-2 border-duo-border bg-white p-3 sm:p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="font-bold text-duo-text text-sm sm:text-base wrap-break-words flex-1">
                        {log.exerciseName}
                      </div>
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 fill-[#58CC02] text-white shrink-0" />
                    </div>
                    <div className="text-xs sm:text-sm text-duo-gray-dark">
                      {
                        log.sets.filter((set) => set.weight > 0 && set.reps > 0)
                          .length
                      }{" "}
                      séries •{" "}
                      {log.sets
                        .filter((set) => set.weight > 0 && set.reps > 0)
                        .reduce((acc, set) => acc + set.weight * set.reps, 0)
                        .toFixed(0)}
                      kg volume
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="flex w-full max-w-md gap-2 sm:gap-3 mb-4 sm:mb-0"
            >
              <Button
                variant="white"
                className="flex-1 text-sm sm:text-base"
                onClick={() => {
                  if (!workout) return;

                  // Limpar progresso salvo para começar do zero
                  clearWorkoutProgress(workout.id);

                  // Reinicializar workout do zero
                  setActiveWorkout(workout);

                  // Resetar tela de conclusão
                  setShowCompletion(false);
                  setCompletedWorkoutData(null);
                }}
              >
                <span className="hidden sm:inline">FAZER NOVAMENTE</span>
                <span className="sm:hidden">REFAZER</span>
              </Button>
              <Button
                variant="default"
                className="flex-1 text-sm sm:text-base"
                onClick={handleClose}
              >
                CONTINUAR
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (showWeightTracker) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex h-screen flex-col bg-white overflow-hidden"
        >
          <div className="border-b-2 border-duo-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setShowWeightTracker(false)}
                className="rounded-xl p-2 transition-colors hover:bg-gray-100"
              >
                <X className="h-6 w-6 text-duo-gray-dark" />
              </button>
              <div className="text-sm font-bold text-duo-gray-dark">
                Exercício{" "}
                {activeWorkout?.currentExerciseIndex !== undefined
                  ? activeWorkout.currentExerciseIndex + 1
                  : 0}
                /{workout.exercises.length}
              </div>
              <div className="w-6" />
            </div>
            <Progress
              key={`progress-weight-${progress}-${currentIndex}-${
                activeWorkout?.exerciseLogs?.length || 0
              }-${activeWorkout?.skippedExercises?.length || 0}`}
              value={progress}
              className="h-3"
            />
          </div>

          {currentExercise && (
            <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
              <WeightTracker
                exerciseName={getCurrentExerciseName()}
                exerciseId={currentExercise.id}
                defaultSets={currentExercise.sets}
                defaultReps={currentExercise.reps}
                onComplete={handleExerciseComplete}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Se não está mostrando conclusão, precisa ter activeWorkout e currentExercise
  if (!showCompletion && (!activeWorkout || !currentExercise)) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {openWorkoutId && (
        <motion.div
          key={openWorkoutId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex h-screen flex-col bg-white overflow-hidden"
        >
          {/* Header Estilo Duolingo */}
          <div className="border-b-2 border-duo-border bg-white p-3 sm:p-4 shadow-sm shrink-0">
            <div className="mb-2 sm:mb-3 flex items-center justify-between">
              <button
                onClick={handleClose}
                className="rounded-xl p-2 transition-colors hover:bg-gray-100 active:scale-95"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-duo-gray-dark" />
              </button>
              <div className="flex items-center gap-1 sm:gap-2">
                {Array.from({ length: hearts }).map((_, i) => (
                  <Heart
                    key={i}
                    className="h-5 w-5 sm:h-6 sm:w-6 fill-duo-red text-duo-red"
                  />
                ))}
              </div>
            </div>
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-duo-gray-dark">
              <div className="flex items-center gap-2">
                <span>
                  Exercício{" "}
                  {activeWorkout?.currentExerciseIndex !== undefined
                    ? activeWorkout.currentExerciseIndex + 1
                    : 0}{" "}
                  de {workout.exercises.length}
                </span>
              </div>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress
              key={`progress-main-${progress}-${
                activeWorkout?.exerciseLogs?.length || 0
              }`}
              value={progress}
              className="h-2 sm:h-3"
            />
          </div>

          {/* Exercise Content */}
          {activeWorkout && currentExercise && (
            <>
              <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center justify-center p-4 sm:p-6 min-h-0">
                <div className="w-full max-w-2xl">
                  {/* Exercise Card Estilo Duolingo */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeWorkout.currentExerciseIndex}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="mb-4 sm:mb-8 rounded-2xl sm:rounded-3xl border-2 border-duo-border bg-linear-to-br from-white to-gray-50 p-4 sm:p-6 lg:p-8 shadow-lg"
                    >
                      <div className="mb-4 sm:mb-6">
                        <h1 className="text-center text-xl sm:text-2xl lg:text-3xl font-black text-duo-text wrap-break-words">
                          {getCurrentExerciseName()}
                        </h1>
                        {activeWorkout?.selectedAlternatives?.[
                          currentExercise.id
                        ] && (
                          <p className="mt-2 text-center text-sm text-duo-blue font-bold">
                            ✓ Alternativa selecionada
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        {isCurrentExerciseCardio() ? (
                          <>
                            {/* Cronômetro Principal - CARDIO */}
                            <div className="rounded-xl sm:rounded-2xl border-2 border-duo-red bg-linear-to-br from-duo-red/10 to-duo-red/5 p-6 sm:p-8 text-center">
                              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                                Tempo
                              </div>
                              <div className="text-5xl sm:text-6xl font-black text-duo-red">
                                {formatTime(elapsedTime)}
                              </div>
                              <div className="mt-3 text-sm text-duo-gray-dark">
                                Meta: {currentExercise.reps}
                              </div>
                            </div>

                            {/* Métricas em Tempo Real - CARDIO */}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                              <div className="rounded-xl border-2 border-duo-orange bg-linear-to-br from-duo-orange/10 to-white p-3 sm:p-4 text-center">
                                <Flame className="mx-auto mb-1 h-5 w-5 text-duo-orange" />
                                <div className="text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                                  Calorias
                                </div>
                                <div className="text-2xl font-black text-duo-orange">
                                  {Math.round(calories)}
                                </div>
                              </div>
                              <div className="rounded-xl border-2 border-duo-red bg-linear-to-br from-duo-red/10 to-white p-3 sm:p-4 text-center">
                                <Activity className="mx-auto mb-1 h-5 w-5 text-duo-red" />
                                <div className="text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                                  FC
                                </div>
                                <div className="text-2xl font-black text-duo-red">
                                  {Math.round(heartRate)} bpm
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Séries e Repetições - FORÇA */}
                            <div className="rounded-xl sm:rounded-2xl border-2 border-[#58CC02] bg-linear-to-br from-[#58CC02]/10 to-[#47A302]/10 p-4 sm:p-6 text-center">
                              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                                Séries e Repetições
                              </div>
                              <div className="text-3xl sm:text-4xl font-black text-[#58CC02]">
                                {currentExercise.sets} x {currentExercise.reps}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                              <div className="rounded-xl border-2 border-duo-blue bg-linear-to-br from-duo-blue/10 to-white p-3 sm:p-4 text-center">
                                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                                  Descanso
                                </div>
                                <div className="text-xl sm:text-2xl font-black text-duo-blue">
                                  {currentExercise.rest}s
                                </div>
                              </div>
                              <div className="rounded-xl border-2 border-duo-orange bg-linear-to-br from-duo-orange/10 to-white p-3 sm:p-4 text-center">
                                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                                  XP
                                </div>
                                <div className="text-xl sm:text-2xl font-black text-duo-orange">
                                  +
                                  {Math.round(
                                    workout.xpReward / workout.exercises.length
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {currentExercise.notes && (
                          <div className="rounded-xl border-2 border-duo-blue bg-linear-to-br from-duo-blue/10 to-white p-3 sm:p-4">
                            <div className="mb-1 flex items-center gap-2 text-xs sm:text-sm font-bold text-duo-blue">
                              <span>💡</span>
                              <span>Dica</span>
                            </div>
                            <p className="text-xs sm:text-sm text-duo-text wrap-break-words">
                              {currentExercise.notes}
                            </p>
                          </div>
                        )}

                        {/* Link para conteúdo educacional */}
                        {currentExercise.educationalId && (
                          <button
                            onClick={() => {
                              if (currentExercise.educationalId) {
                                handleViewEducation(
                                  currentExercise.educationalId
                                );
                              }
                            }}
                            className="w-full rounded-xl border-2 border-duo-green/30 bg-duo-green/5 p-3 text-left transition-all hover:border-duo-green/50 hover:bg-duo-green/10"
                          >
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5 shrink-0 text-duo-green" />
                              <div className="flex-1">
                                <div className="text-xs sm:text-sm font-bold text-duo-green">
                                  Ver técnica detalhada
                                </div>
                                <div className="text-xs text-duo-gray-dark">
                                  Instruções completas, dicas e erros comuns
                                </div>
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Botões fixos na parte inferior */}
              <div className="border-t-2 border-duo-border bg-white p-3 sm:p-4 shadow-lg shrink-0">
                <div className="mx-auto max-w-2xl">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="space-y-2 sm:space-y-3"
                  >
                    {isCurrentExerciseCardio() ? (
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsRunning(!isRunning)}
                        className={cn(
                          "w-full rounded-xl sm:rounded-2xl py-3 sm:py-4 font-bold text-white transition-all flex items-center justify-center gap-2",
                          isRunning
                            ? "bg-duo-orange hover:bg-duo-orange/90"
                            : "bg-duo-green hover:bg-duo-green/90"
                        )}
                      >
                        {isRunning ? (
                          <>
                            <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>PAUSAR</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>INICIAR</span>
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowWeightTracker(true)}
                        className="duo-button-green w-full flex items-center justify-center gap-2 text-sm sm:text-base lg:text-lg py-3 sm:py-4"
                      >
                        <Weight className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">
                          REGISTRAR SÉRIES E CARGAS
                        </span>
                        <span className="sm:hidden">SÉRIES E CARGAS</span>
                      </motion.button>
                    )}

                    {/* Botão de alternativas - VERSÃO ATUALIZADA */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        console.log("👆 Clicou em VER ALTERNATIVAS");
                        console.log("currentExercise:", currentExercise);
                        setShowAlternativeSelector(true);
                      }}
                      className="w-full rounded-xl sm:rounded-2xl border-2 border-duo-blue bg-duo-blue/10 py-3 sm:py-4 font-bold text-xs sm:text-sm text-duo-blue transition-all hover:bg-duo-blue/20 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        EQUIPAMENTO OCUPADO? VER ALTERNATIVAS (
                        {currentExercise?.alternatives?.length || 0})
                      </span>
                      <span className="sm:hidden">
                        VER ALTERNATIVAS (
                        {currentExercise?.alternatives?.length || 0})
                      </span>
                    </motion.button>

                    {/* Botão CONCLUIR para cardio */}
                    {isCurrentExerciseCardio() && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCardioComplete}
                        className="w-full rounded-xl sm:rounded-2xl bg-duo-green py-3 sm:py-4 font-bold text-white hover:bg-duo-green/90 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>CONCLUIR EXERCÍCIO</span>
                      </motion.button>
                    )}

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {activeWorkout &&
                        activeWorkout.currentExerciseIndex > 0 && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              if (activeWorkout) {
                                setCurrentExerciseIndex(
                                  activeWorkout.currentExerciseIndex - 1
                                );
                                saveWorkoutProgress(workout.id);
                              }
                            }}
                            className="rounded-xl sm:rounded-2xl border-2 border-duo-border bg-white py-3 sm:py-4 font-bold text-xs sm:text-sm text-duo-gray-dark transition-all hover:bg-gray-50"
                          >
                            <span className="hidden sm:inline">← ANTERIOR</span>
                            <span className="sm:hidden">ANTERIOR</span>
                          </motion.button>
                        )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSkip}
                        className={cn(
                          "rounded-xl sm:rounded-2xl border-2 border-duo-border bg-white py-3 sm:py-4 font-bold text-xs sm:text-sm text-duo-gray-dark transition-all hover:bg-gray-50",
                          activeWorkout &&
                            activeWorkout.currentExerciseIndex === 0 &&
                            "col-span-2"
                        )}
                      >
                        <span className="hidden sm:inline">
                          PULAR EXERCÍCIO
                        </span>
                        <span className="sm:hidden">PULAR</span>
                      </motion.button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </>
          )}

          {/* Alternative Selector Modal */}
          <AnimatePresence>
            {showAlternativeSelector && currentExercise && (
              <ExerciseAlternativeSelector
                exercise={currentExercise}
                onSelect={handleSelectAlternative}
                onCancel={() => setShowAlternativeSelector(false)}
                onViewEducation={handleViewEducation}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
