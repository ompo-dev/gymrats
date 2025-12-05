"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mockWorkouts } from "@/lib/mock-data";
import { X, Heart, Zap, Weight, CheckCircle2, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { WeightTracker } from "@/components/weight-tracker";
import type { ExerciseLog, WorkoutSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { FadeIn } from "@/components/animations/fade-in";
import { useWorkoutStore, useStudentStore, useUIStore } from "@/stores";

export default function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [workout] = useState(() => mockWorkouts.find((w) => w.id === id));
  const {
    activeWorkout,
    setActiveWorkout,
    setCurrentExerciseIndex,
    addExerciseLog,
    saveWorkoutProgress,
    loadWorkoutProgress,
    completeWorkout,
    clearWorkoutProgress,
  } = useWorkoutStore();
  const { completeWorkout: completeStudentWorkout, addXP } = useStudentStore();
  const { showWeightTracker, setShowWeightTracker } = useUIStore();
  const [showCompletion, setShowCompletion] = useState(false);

  // Inicializar workout quando montar
  useEffect(() => {
    if (!workout) return;
    setActiveWorkout(workout);

    // Carregar progresso salvo
    const savedProgress = loadWorkoutProgress(workout.id);
    if (savedProgress) {
      setCurrentExerciseIndex(savedProgress.currentExerciseIndex);
      savedProgress.exerciseLogs.forEach((log) => addExerciseLog(log));
    }

    return () => {
      // Ao desmontar, salvar progresso apenas se houver logs
      // O progresso será salvo pelo outro useEffect que monitora activeWorkout
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout]);

  // Salvar progresso sempre que mudar (só se houver logs)
  useEffect(() => {
    if (!workout || !activeWorkout) return;
    // Só salva se houver pelo menos um log de exercício
    if (activeWorkout.exerciseLogs.length > 0) {
      saveWorkoutProgress(workout.id);

      // Disparar evento customizado para atualizar outros componentes
      window.dispatchEvent(
        new CustomEvent("workoutProgressUpdate", {
          detail: {
            workoutId: workout.id,
            progress: {
              currentExerciseIndex: activeWorkout.currentExerciseIndex,
              exerciseLogs: activeWorkout.exerciseLogs,
            },
          },
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout, activeWorkout]);

  if (!workout || !activeWorkout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-duo-gray-dark">Treino não encontrado</p>
      </div>
    );
  }

  const currentExercise = workout.exercises[activeWorkout.currentExerciseIndex];
  const progress =
    (activeWorkout.exerciseLogs.length / workout.exercises.length) * 100;
  const hearts = 5;

  const handleExerciseComplete = (log: ExerciseLog) => {
    addExerciseLog(log);
    setShowWeightTracker(false);

    if (activeWorkout.currentExerciseIndex + 1 >= workout.exercises.length) {
      // Marcar treino como completo
      completeWorkout(workout.id);
      clearWorkoutProgress(workout.id);
      completeStudentWorkout(workout.id, workout.xpReward);
      addXP(workout.xpReward);

      // Disparar evento de conclusão
      window.dispatchEvent(
        new CustomEvent("workoutCompleted", {
          detail: { workoutId: workout.id },
        })
      );

      setShowCompletion(true);
    } else {
      setCurrentExerciseIndex(activeWorkout.currentExerciseIndex + 1);
    }
  };

  const handleSkip = () => {
    if (activeWorkout.currentExerciseIndex + 1 >= workout.exercises.length) {
      setShowCompletion(true);
    } else {
      setCurrentExerciseIndex(activeWorkout.currentExerciseIndex + 1);
    }
  };

  const handleExit = () => {
    // Salvar progresso antes de sair
    if (workout && activeWorkout && activeWorkout.exerciseLogs.length > 0) {
      saveWorkoutProgress(workout.id);
    }
    // Voltar para a página anterior ou para /student
    router.back();
  };

  if (showCompletion) {
    const totalVolume = activeWorkout.exerciseLogs.reduce(
      (acc, log) =>
        acc +
        log.sets.reduce((setAcc, set) => setAcc + set.weight * set.reps, 0),
      0
    );

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 p-4"
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
            className="rounded-2xl border-2 border-[#FFC800] bg-gradient-to-br from-[#FFC800]/20 to-[#FF9600]/20 p-6 text-center shadow-lg"
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
            className="rounded-2xl border-2 border-[#1CB0F6] bg-gradient-to-br from-[#1CB0F6]/20 to-[#58CC02]/20 p-6 text-center shadow-lg"
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

        {activeWorkout.exerciseLogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mb-6 w-full max-w-md space-y-3"
          >
            <h3 className="text-lg font-bold text-duo-text">
              Resumo do Treino
            </h3>
            {activeWorkout.exerciseLogs.map((log, index) => (
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
                  {log.sets.length} séries •{" "}
                  {log.sets
                    .reduce((acc, set) => acc + set.weight * set.reps, 0)
                    .toFixed(0)}
                  kg volume
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExit}
          className="duo-button-green w-full max-w-md flex items-center justify-center gap-2 text-lg"
        >
          CONTINUAR
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </motion.div>
    );
  }

  if (showWeightTracker) {
    return (
      <div className="h-screen flex flex-col bg-white overflow-hidden">
        <div className="border-b-2 border-duo-border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setShowWeightTracker(false)}
              className="rounded-xl p-2 transition-colors hover:bg-gray-100"
            >
              <X className="h-6 w-6 text-duo-gray-dark" />
            </button>
            <div className="text-sm font-bold text-duo-gray-dark">
              Exercício {activeWorkout.currentExerciseIndex + 1}/
              {workout.exercises.length}
            </div>
            <div className="w-6" />
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
          <WeightTracker
            exerciseName={currentExercise.name}
            exerciseId={currentExercise.id}
            defaultSets={currentExercise.sets}
            defaultReps={currentExercise.reps}
            onComplete={handleExerciseComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-screen flex flex-col bg-white overflow-hidden"
    >
      {/* Header Estilo Duolingo */}
      <div className="border-b-2 border-duo-border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={handleExit}
            className="rounded-xl p-2 transition-colors hover:bg-gray-100 active:scale-95"
          >
            <X className="h-6 w-6 text-duo-gray-dark" />
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: hearts }).map((_, i) => (
              <Heart key={i} className="h-6 w-6 fill-duo-red text-duo-red" />
            ))}
          </div>
        </div>
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-duo-gray-dark">
          <span>
            Exercício {activeWorkout.currentExerciseIndex + 1} de{" "}
            {workout.exercises.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Exercise Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Exercise Card Estilo Duolingo */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeWorkout.currentExerciseIndex}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="mb-8 rounded-3xl border-2 border-duo-border bg-gradient-to-br from-white to-gray-50 p-8 shadow-lg"
            >
              <div className="mb-6 text-center">
                <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#58CC02] to-[#47A302] text-5xl shadow-lg">
                  💪
                </div>
              </div>

              <h1 className="mb-6 text-center text-3xl font-black text-duo-text">
                {currentExercise.name}
              </h1>

              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-[#58CC02] bg-gradient-to-br from-[#58CC02]/10 to-[#47A302]/10 p-6 text-center">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                    Séries e Repetições
                  </div>
                  <div className="text-4xl font-black text-[#58CC02]">
                    {currentExercise.sets} x {currentExercise.reps}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border-2 border-duo-blue bg-gradient-to-br from-duo-blue/10 to-white p-4 text-center">
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                      Descanso
                    </div>
                    <div className="text-2xl font-black text-duo-blue">
                      {currentExercise.rest}s
                    </div>
                  </div>
                  <div className="rounded-xl border-2 border-duo-orange bg-gradient-to-br from-duo-orange/10 to-white p-4 text-center">
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                      XP
                    </div>
                    <div className="text-2xl font-black text-duo-orange">
                      +{Math.round(workout.xpReward / workout.exercises.length)}
                    </div>
                  </div>
                </div>

                {currentExercise.notes && (
                  <div className="rounded-xl border-2 border-duo-blue bg-gradient-to-br from-duo-blue/10 to-white p-4">
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

          {/* Action Buttons */}
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSkip}
              className="w-full rounded-2xl border-2 border-duo-border bg-white py-4 font-bold text-duo-gray-dark transition-all hover:bg-gray-50"
            >
              PULAR EXERCÍCIO
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
