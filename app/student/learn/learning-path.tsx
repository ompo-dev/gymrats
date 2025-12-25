"use client";

import React, { useEffect, useState, useMemo } from "react";
import type { Unit, WorkoutSession } from "@/lib/types";
import { WorkoutNode } from "../../../components/workout-node";
import { Lock } from "lucide-react";
import { useWorkoutStore } from "@/stores/workout-store";
import { useStudent } from "@/hooks/use-student";
import { StaggerContainer } from "../../../components/animations/stagger-container";
import { StaggerItem } from "../../../components/animations/stagger-item";
import { motion } from "motion/react";
import { UnitSectionCard } from "../../../components/ui/unit-section-card";
import { useRouter } from "next/navigation";

// Store simples para armazenar units carregadas (para uso no modal)
let cachedUnits: Unit[] = [];
export function setCachedUnits(units: Unit[]) {
  cachedUnits = units;
}
export function getCachedUnits(): Unit[] {
  return cachedUnits;
}

interface LearningPathProps {
  units: Unit[];
  onLessonSelect: (lessonId: string) => void;
}

export function LearningPath({ units, onLessonSelect }: LearningPathProps) {
  const router = useRouter();
  const openWorkout = useWorkoutStore((state) => state.openWorkout);
  const openWorkoutId = useWorkoutStore((state) => state.openWorkoutId);

  // Usar hook unificado para units
  const { units: storeUnits } = useStudent("units");
  const { completeWorkout } = useStudent("actions");

  // Estado para forçar re-render quando units mudarem
  const [unitsKey, setUnitsKey] = useState(0);
  const [reloadedUnits, setReloadedUnits] = useState<Unit[] | null>(null);

  // Usar units do store com fallback para props
  const currentUnits = useMemo(
    () =>
      reloadedUnits ||
      (storeUnits && storeUnits.length > 0 ? storeUnits : units),
    [unitsKey, reloadedUnits, storeUnits, units]
  );

  // Cachear units para uso no modal
  useEffect(() => {
    setCachedUnits(currentUnits);
  }, [currentUnits]);

  // Carregar units do store ao montar
  const { loadWorkouts } = useStudent("loaders");

  useEffect(() => {
    // Carregar units se não tiver no store
    if (!storeUnits || storeUnits.length === 0) {
      loadWorkouts();
    }
  }, [storeUnits, loadWorkouts]);

  // Recarregar units quando um workout é completado
  useEffect(() => {
    const handleWorkoutCompleted = async (event: Event) => {
      const customEvent = event as CustomEvent<{ workoutId?: string }>;
      const { workoutId } = customEvent.detail || {};

      if (!workoutId) return;

      // Marcar como completo no store local imediatamente (optimistic update)
      const store = useWorkoutStore.getState();
      store.completeWorkout(workoutId);

      // Recarregar units do store unificado (que sincroniza com API via axios)
      await loadWorkouts();

      // Atualizar estado local para forçar re-render
      setUnitsKey((prev) => prev + 1);
    };

    window.addEventListener("workoutCompleted", handleWorkoutCompleted);

    return () => {
      window.removeEventListener("workoutCompleted", handleWorkoutCompleted);
    };
  }, [router, loadWorkouts]);

  const handleWorkoutClick = (
    workoutId: string,
    locked: boolean,
    workoutType?: string
  ) => {
    // Debug: verificar se está bloqueado
    console.log("[DEBUG] handleWorkoutClick:", {
      workoutId,
      locked,
      workoutType,
    });

    if (locked) {
      console.log("[DEBUG] Workout está bloqueado, não abrindo modal");
      return;
    }

    console.log("[DEBUG] Abrindo workout:", workoutId);

    // Para qualquer tipo de treino (cardio ou strength), abre o modal
    // O modal correto será renderizado baseado no tipo
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
      {currentUnits.map((unit: Unit, unitIndex: number) => {
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
                  // IMPORTANTE: Usar currentUnits (que inclui reloadedUnits) em vez de units
                  const previousUnitsWorkouts = currentUnits
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
                        onClick={() => {
                          // Calcular isLocked dinamicamente no momento do clique
                          // IMPORTANTE: Usar a mesma lógica otimista do WorkoutNode
                          const store = useWorkoutStore.getState();

                          const allPreviousInUnitCompleted =
                            previousWorkoutsInSameUnit.length === 0
                              ? true
                              : previousWorkoutsInSameUnit.every(
                                  (prevWorkout: WorkoutSession) =>
                                    store.isWorkoutCompleted(prevWorkout.id)
                                );

                          const allPreviousUnitsCompleted =
                            previousUnitsWorkouts.length === 0
                              ? true
                              : previousUnitsWorkouts.every(
                                  (prevWorkout: WorkoutSession) =>
                                    store.isWorkoutCompleted(prevWorkout.id)
                                );

                          // Priorizar estado otimista do store sobre workout.locked do backend
                          const allPreviousCompleted = isFirstInUnit
                            ? previousUnitsWorkouts.length === 0 ||
                              allPreviousUnitsCompleted
                            : allPreviousInUnitCompleted;

                          // Se todos os workouts anteriores foram completados no store, desbloquear
                          // independente do workout.locked do backend
                          const shouldBeLocked = allPreviousCompleted
                            ? false // Se todos anteriores estão completos no store, desbloquear
                            : workout.locked || // Caso contrário, usar locked do backend
                              (!isFirstInUnit && !allPreviousInUnitCompleted) ||
                              (isFirstInUnit &&
                                previousUnitsWorkouts.length > 0 &&
                                !allPreviousUnitsCompleted);

                          // Se é o primeiro workout da primeira unit, nunca deve estar locked
                          const isLocked =
                            unitIndex === 0 && workoutIndex === 0
                              ? false
                              : shouldBeLocked;

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
