"use client";

import type { Unit } from "@/lib/types";
import { WorkoutNode } from "../../../components/workout-node";
import { Trophy, Lock } from "lucide-react";
import { useWorkoutStore } from "@/stores/workout-store";
import { StaggerContainer } from "../../../components/animations/stagger-container";
import { StaggerItem } from "../../../components/animations/stagger-item";
import { motion } from "motion/react";
import { UnitSectionCard } from "../../../components/ui/unit-section-card";

interface LearningPathProps {
  units: Unit[];
  onLessonSelect: (lessonId: string) => void;
}

export function LearningPath({ units, onLessonSelect }: LearningPathProps) {
  const openWorkout = useWorkoutStore((state) => state.openWorkout);
  const openWorkoutId = useWorkoutStore((state) => state.openWorkoutId);

  const handleWorkoutClick = (workoutId: string, locked: boolean) => {
    if (locked) return;
    // Sempre fechar primeiro para garantir que o useEffect dispare novamente
    // Isso permite reabrir o mesmo workout após completá-lo
    if (openWorkoutId === workoutId) {
      // Se já está aberto, fechar primeiro e depois reabrir
      openWorkout(null);
      // Usar setTimeout para garantir que o estado seja atualizado
      setTimeout(() => {
        openWorkout(workoutId);
        onLessonSelect(workoutId);
      }, 0);
    } else {
      openWorkout(workoutId);
      onLessonSelect(workoutId);
    }
  };

  if (!units || units.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-duo-gray-dark">Nenhum treino disponível</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-2xl py-8">
      {units.map((unit, unitIndex) => {
        const completedCount = unit.workouts.filter((w) => w.completed).length;
        const totalCount = unit.workouts.length;

        return (
          <motion.div
            key={unit.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: unitIndex * 0.1, duration: 0.4 }}
            className="mb-12"
          >
            {/* Unit Header - Estilo Duolingo */}
            <div className="mb-8">
              <UnitSectionCard
                sectionLabel={unit.title}
                title={unit.description}
                buttonHref="/student?tab=education"
              />
            </div>

            {/* Workouts Path - Sem linhas de conexão */}
            <StaggerContainer className="relative flex flex-col items-center space-y-6">
              {unit.workouts.map((workout, workoutIndex) => {
                const isFirstInUnit = workoutIndex === 0;
                // Pegar todos os workouts anteriores:
                // 1. Todos os workouts de unidades anteriores
                // 2. Workouts anteriores na mesma unidade
                const previousUnitsWorkouts = units
                  .slice(0, unitIndex)
                  .flatMap((u) => u.workouts);
                const previousWorkoutsInSameUnit = unit.workouts.slice(
                  0,
                  workoutIndex
                );
                const previousWorkouts = [
                  ...previousUnitsWorkouts,
                  ...previousWorkoutsInSameUnit,
                ];

                const positions = [
                  "center",
                  "left",
                  "right",
                  "center",
                  "left",
                  "right",
                ];
                const position = positions[workoutIndex % positions.length] as
                  | "left"
                  | "center"
                  | "right";

                return (
                  <StaggerItem key={workout.id} className="relative w-full">
                    <WorkoutNode
                      workout={workout}
                      position={position}
                      onClick={() =>
                        handleWorkoutClick(workout.id, workout.locked)
                      }
                      isFirst={isFirstInUnit}
                      previousWorkouts={previousWorkouts}
                      previousUnitsWorkouts={previousUnitsWorkouts}
                    />
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </motion.div>
        );
      })}

      {/* Treasure chest at the end - Duolingo style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mt-12 flex justify-center"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-duo-gray bg-white shadow-md">
            <Lock className="h-10 w-10 text-duo-gray-dark" />
          </div>
          <p className="text-sm font-bold text-duo-gray-dark">
            Continue praticando para desbloquear!
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
