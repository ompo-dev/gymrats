"use client";

import { ArrowRight, Dumbbell, Play } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { DuoButton, DuoCard } from "@/components/duo";
import type { Unit, WorkoutHistory } from "@/lib/types";

interface ContinueWorkoutCardProps {
  units: Unit[];
  workoutHistory: WorkoutHistory[];
}

function ContinueWorkoutCardSimple({
  units,
  workoutHistory,
}: ContinueWorkoutCardProps) {
  const router = useRouter();
  const safeUnits = Array.isArray(units) ? units : [];
  const safeWorkoutHistory = Array.isArray(workoutHistory)
    ? workoutHistory
    : [];

  const findNextWorkout = () => {
    for (const unit of safeUnits) {
      if (unit.workouts && unit.workouts.length > 0) {
        const nextWorkout = unit.workouts.find(
          (workout) => !workout.completed && !workout.locked,
        );
        if (nextWorkout) {
          return {
            workout: nextWorkout,
            unitTitle: unit.title,
          };
        }
      }
    }
    return null;
  };

  const findLastCompletedWorkout = () => {
    if (safeWorkoutHistory.length === 0) return null;
    return safeWorkoutHistory[0];
  };

  const nextWorkout = findNextWorkout();
  const lastCompleted = findLastCompletedWorkout();

  if (!nextWorkout && !lastCompleted) {
    return (
      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <Dumbbell
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-[var(--duo-fg)]">
              Continue seu Treino
            </h2>
          </div>
        </DuoCard.Header>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="flex flex-col items-center justify-center space-y-4 py-6 text-center"
        >
          <Dumbbell className="h-10 w-10 text-duo-green" />
          <p className="text-base font-bold text-duo-text">
            Comece sua jornada!
          </p>
          <p className="text-sm text-duo-fg-muted">
            Seus treinos personalizados estao prontos. Comece agora!
          </p>
          <DuoButton
            onClick={() => router.push("/student?tab=learn")}
            variant="primary"
            className="w-fit"
          >
            <Play className="h-4 w-4 mr-2" />
            Ver Treinos
            <ArrowRight className="h-4 w-4 ml-2" />
          </DuoButton>
        </motion.div>
      </DuoCard.Root>
    );
  }

  if (nextWorkout) {
    const workoutUrl = `/student?tab=learn&modal=workout&workoutId=${nextWorkout.workout.id}`;

    return (
      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <Dumbbell
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-[var(--duo-fg)]">
              Continue seu Treino
            </h2>
          </div>
        </DuoCard.Header>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-duo-green/10 text-2xl">
              💪
            </div>
            <div className="flex-1">
              <p className="font-bold text-duo-text">
                {nextWorkout.workout.title}
              </p>
              <p className="text-xs text-duo-fg-muted">
                {nextWorkout.unitTitle}
              </p>
            </div>
          </div>
          <DuoButton
            onClick={() => router.push(workoutUrl)}
            variant="primary"
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            Continuar Treino
          </DuoButton>
        </motion.div>
      </DuoCard.Root>
    );
  }

  if (lastCompleted) {
    return (
      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <Dumbbell
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-[var(--duo-fg)]">
              Continue seu Treino
            </h2>
          </div>
        </DuoCard.Header>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-duo-green/10 text-2xl">
              ✅
            </div>
            <div className="flex-1">
              <p className="font-bold text-duo-text">
                Ultimo treino: {lastCompleted.workoutName}
              </p>
              <p className="text-xs text-duo-fg-muted">
                {new Date(lastCompleted.date).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
          </div>
          <DuoButton
            onClick={() => router.push("/student?tab=learn")}
            variant="primary"
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            Ver Proximo Treino
            <ArrowRight className="h-4 w-4 ml-2" />
          </DuoButton>
        </motion.div>
      </DuoCard.Root>
    );
  }

  return null;
}

export const ContinueWorkoutCard = {
  Simple: ContinueWorkoutCardSimple,
};
