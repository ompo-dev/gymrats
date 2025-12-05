"use client";

import { useState, useEffect } from "react";
import { mockWorkouts } from "@/lib/mock-data";
import { X, Heart, Zap, Weight, CheckCircle2, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { WeightTracker } from "@/components/weight-tracker";
import type { ExerciseLog, WorkoutSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { FadeIn } from "@/components/animations/fade-in";
import { useWorkoutStore, useStudentStore, useUIStore } from "@/stores";

export function WorkoutModal() {
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
  } = useWorkoutStore();
  const { completeWorkout: completeStudentWorkout, addXP } = useStudentStore();
  const { showWeightTracker, setShowWeightTracker } = useUIStore();
  const [showCompletion, setShowCompletion] = useState(false);
  // Salvar dados do workout completado para mostrar na tela de conclusão
  const [completedWorkoutData, setCompletedWorkoutData] = useState<{
    exerciseLogs: ExerciseLog[];
    xpEarned: number;
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
      return;
    }

    // Sempre resetar tela de conclusão quando abrir
    setShowCompletion(false);
    setShowWeightTracker(false);
    setCompletedWorkoutData(null);

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
        },
      });
    } else {
      // Inicializar workout novo
      setActiveWorkout(workout);
    }

    return () => {
      // Ao fechar, salvar progresso sempre (mesmo sem logs, para manter índice e exercícios pulados)
      const currentState = useWorkoutStore.getState();
      if (workout && currentState.activeWorkout) {
        currentState.saveWorkoutProgress(workout.id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openWorkoutId, workout]);

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

  const handleSkip = () => {
    if (!activeWorkout) return;

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
            className="flex min-h-screen w-full flex-col items-center justify-center bg-linear-to-b from-white to-gray-50 p-4"
          >
            <FadeIn delay={0.1}>
              <div className="mb-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 10,
                    delay: 0.2,
                  }}
                  className="mb-6 text-8xl"
                >
                  🎉
                </motion.div>
                <h1 className="mb-2 text-4xl font-black text-[#58CC02]">
                  Treino Completo!
                </h1>
                <p className="text-lg text-duo-gray-dark">
                  Excelente trabalho hoje!
                </p>
              </div>
            </FadeIn>

            <div className="mb-8 grid w-full max-w-md grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                whileHover={{ scale: 1.05 }}
                className="rounded-2xl border-2 border-[#FFC800] bg-linear-to-br from-[#FFC800]/20 to-[#FF9600]/20 p-6 text-center shadow-lg"
              >
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Zap className="h-6 w-6 text-[#FFC800]" />
                </div>
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                  XP Ganho
                </div>
                <div className="text-3xl font-black text-[#FFC800]">
                  {workout.xpReward}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                whileHover={{ scale: 1.05 }}
                className="rounded-2xl border-2 border-[#1CB0F6] bg-linear-to-br from-[#1CB0F6]/20 to-[#58CC02]/20 p-6 text-center shadow-lg"
              >
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Weight className="h-6 w-6 text-[#1CB0F6]" />
                </div>
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                  Volume Total
                </div>
                <div className="text-3xl font-black text-[#1CB0F6]">
                  {totalVolume.toFixed(0)}kg
                </div>
              </motion.div>
            </div>

            {workoutData.exerciseLogs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="mb-6 w-full max-w-md space-y-3"
              >
                <h3 className="text-lg font-bold text-duo-text">
                  Resumo do Treino
                </h3>
                {workoutData.exerciseLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="rounded-xl border-2 border-duo-border bg-white p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-bold text-duo-text">
                        {log.exerciseName}
                      </div>
                      <CheckCircle2 className="h-5 w-5 fill-[#58CC02] text-white" />
                    </div>
                    <div className="text-sm text-duo-gray-dark">
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
              className="flex w-full max-w-md gap-3"
            >
              <Button
                variant="white"
                className="flex-1"
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
                FAZER NOVAMENTE
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={handleClose}
              >
                CONTINUAR
                <ArrowRight className="h-5 w-5" />
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
                exerciseName={currentExercise.name}
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
          <div className="border-b-2 border-duo-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={handleClose}
                className="rounded-xl p-2 transition-colors hover:bg-gray-100 active:scale-95"
              >
                <X className="h-6 w-6 text-duo-gray-dark" />
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: hearts }).map((_, i) => (
                  <Heart
                    key={i}
                    className="h-6 w-6 fill-duo-red text-duo-red"
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
              className="h-3"
            />
          </div>

          {/* Exercise Content */}
          {activeWorkout && currentExercise && (
            <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center justify-center p-6 pb-32">
              <div className="w-full max-w-2xl">
                {/* Exercise Card Estilo Duolingo */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeWorkout.currentExerciseIndex}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="mb-8 rounded-3xl border-2 border-duo-border bg-linear-to-br from-white to-gray-50 p-8 shadow-lg"
                  >
                    <div className="mb-6 text-center">
                      <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-[#58CC02] to-[#47A302] text-5xl shadow-lg">
                        💪
                      </div>
                    </div>

                    <h1 className="mb-6 text-center text-3xl font-black text-duo-text">
                      {currentExercise.name}
                    </h1>

                    <div className="space-y-4">
                      <div className="rounded-2xl border-2 border-[#58CC02] bg-linear-to-br from-[#58CC02]/10 to-[#47A302]/10 p-6 text-center">
                        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                          Séries e Repetições
                        </div>
                        <div className="text-4xl font-black text-[#58CC02]">
                          {currentExercise.sets} x {currentExercise.reps}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl border-2 border-duo-blue bg-linear-to-br from-duo-blue/10 to-white p-4 text-center">
                          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                            Descanso
                          </div>
                          <div className="text-2xl font-black text-duo-blue">
                            {currentExercise.rest}s
                          </div>
                        </div>
                        <div className="rounded-xl border-2 border-duo-orange bg-linear-to-br from-duo-orange/10 to-white p-4 text-center">
                          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                            XP
                          </div>
                          <div className="text-2xl font-black text-duo-orange">
                            +
                            {Math.round(
                              workout.xpReward / workout.exercises.length
                            )}
                          </div>
                        </div>
                      </div>

                      {currentExercise.notes && (
                        <div className="rounded-xl border-2 border-duo-blue bg-linear-to-br from-duo-blue/10 to-white p-4">
                          <div className="mb-1 flex items-center gap-2 text-sm font-bold text-duo-blue">
                            <span>💡</span>
                            <span>Dica</span>
                          </div>
                          <p className="text-sm text-duo-text">
                            {currentExercise.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Botões fixos na parte inferior */}
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-duo-border bg-white p-4 shadow-lg">
                  <div className="mx-auto max-w-2xl">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="space-y-3"
                    >
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowWeightTracker(true)}
                        className="duo-button-green w-full flex items-center justify-center gap-2 text-lg py-4"
                      >
                        <Weight className="h-5 w-5" />
                        REGISTRAR SÉRIES E CARGAS
                      </motion.button>
                      <div className="grid grid-cols-2 gap-3">
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
                              className="rounded-2xl border-2 border-duo-border bg-white py-4 font-bold text-duo-gray-dark transition-all hover:bg-gray-50"
                            >
                              ← ANTERIOR
                            </motion.button>
                          )}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSkip}
                          className={cn(
                            "rounded-2xl border-2 border-duo-border bg-white py-4 font-bold text-duo-gray-dark transition-all hover:bg-gray-50",
                            activeWorkout &&
                              activeWorkout.currentExerciseIndex === 0 &&
                              "col-span-2"
                          )}
                        >
                          PULAR EXERCÍCIO
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
