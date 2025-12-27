"use client";

import React, { useEffect } from "react";
import type { Unit, WorkoutSession } from "@/lib/types";
import { WorkoutNode } from "@/components/organisms/workout/workout-node";
import { Lock } from "lucide-react";
import { useWorkoutStore } from "@/stores/workout-store";
import { useStudent } from "@/hooks/use-student";
import { useLoadPrioritized } from "@/hooks/use-load-prioritized";
import { StaggerContainer } from "../../../components/animations/stagger-container";
import { StaggerItem } from "../../../components/animations/stagger-item";
import { motion } from "motion/react";
import { UnitSectionCard } from "../../../components/ui/unit-section-card";
import { useRouter } from "next/navigation";
import { useModalStateWithParam } from "@/hooks/use-modal-state";
import { parseAsInteger, useQueryState } from "nuqs";

interface LearningPathProps {
  onLessonSelect: (lessonId: string) => void;
}

export function LearningPath({ onLessonSelect }: LearningPathProps) {
  const router = useRouter();
  const workoutModal = useModalStateWithParam("workout", "workoutId");
  const [, setExerciseIndexParam] = useQueryState(
    "exerciseIndex",
    parseAsInteger
  );

  // Carregamento prioritizado: units e progress aparecem primeiro
  // Se dados já existem no store, só carrega o que falta
  useLoadPrioritized({ context: "learn" });

  // Usar hook unificado - fonte única da verdade
  // Dados são carregados automaticamente pelo useStudentInitializer no layout
  const units = useStudent("units");
  const { loadWorkouts } = useStudent("loaders");

  // Recarregar units quando um workout é completado (optimistic update já feito)
  // Isso atualiza o status locked/completed dos workouts no backend
  useEffect(() => {
    const handleWorkoutCompleted = async (event: Event) => {
      const customEvent = event as CustomEvent<{ workoutId?: string }>;
      const { workoutId } = customEvent.detail || {};

      if (!workoutId) return;

      console.log("[DEBUG] Workout completado, recarregando units:", workoutId);

      // Marcar como completo no store local imediatamente (optimistic update)
      const store = useWorkoutStore.getState();
      store.completeWorkout(workoutId);

      // Recarregar units do store unificado para sincronizar com backend
      // Isso atualiza o status locked/completed dos workouts
      // Forçar carregamento mesmo se loadAll estiver em progresso
      try {
        await loadWorkouts(true); // force = true para garantir atualização
        console.log("[DEBUG] Units recarregados após completar workout");
      } catch (error) {
        console.error("[DEBUG] Erro ao recarregar units:", error);
      }
    };

    window.addEventListener("workoutCompleted", handleWorkoutCompleted);

    return () => {
      window.removeEventListener("workoutCompleted", handleWorkoutCompleted);
    };
  }, [loadWorkouts]);

  const handleWorkoutClick = (
    workoutId: string,
    isLocked: boolean, // Recebe isLocked calculado do WorkoutNode
    workoutType?: string,
    exerciseIndex?: number
  ) => {
    // Debug: verificar se está bloqueado
    console.log("[DEBUG] handleWorkoutClick:", {
      workoutId,
      isLocked,
      workoutType,
      exerciseIndex,
    });

    // Se está bloqueado (calculado pelo WorkoutNode), não abrir
    if (isLocked) {
      console.log("[DEBUG] Workout está bloqueado (calculado pelo WorkoutNode), não abrindo modal");
      return;
    }

    console.log("[DEBUG] Abrindo workout:", workoutId);

    // Para qualquer tipo de treino (cardio ou strength), abre o modal
    // O modal correto será renderizado baseado no tipo
    if (workoutModal.paramValue === workoutId) {
      // Se já está aberto, fechar primeiro e depois reabrir
      workoutModal.close();
      // Usar setTimeout para garantir que o estado seja atualizado
      setTimeout(() => {
        workoutModal.open(workoutId);
        if (exerciseIndex !== undefined) {
          setExerciseIndexParam(exerciseIndex);
        }
        onLessonSelect(workoutId);
      }, 0);
    } else {
      workoutModal.open(workoutId);
      if (exerciseIndex !== undefined) {
        setExerciseIndexParam(exerciseIndex);
      }
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
      {units.map((unit: Unit, unitIndex: number) => {
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
              {unit.workouts.map(
                (workout: WorkoutSession, workoutIndex: number) => {
                  const isFirstInUnit = workoutIndex === 0;
                  // Pegar todos os workouts anteriores:
                  // 1. Todos os workouts de unidades anteriores
                  // 2. Workouts anteriores na mesma unidade
                  const previousUnitsWorkouts = units
                    .slice(0, unitIndex)
                    .flatMap((u: Unit) => u.workouts);
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
                  const position = positions[
                    workoutIndex % positions.length
                  ] as "left" | "center" | "right";

                  return (
                    <StaggerItem key={workout.id} className="relative w-full">
                      <WorkoutNode
                        workout={workout}
                        position={position}
                        onClick={(isLocked) => {
                          // WorkoutNode passa isLocked calculado (considera estado otimista)
                          // handleWorkoutClick usa esse valor para decidir se abre o modal
                          handleWorkoutClick(
                            workout.id,
                            isLocked,
                            workout.type
                          );
                        }}
                        isFirst={isFirstInUnit}
                        previousWorkouts={previousWorkoutsInSameUnit}
                        previousUnitsWorkouts={previousUnitsWorkouts}
                      />
                    </StaggerItem>
                  );
                }
              )}
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
