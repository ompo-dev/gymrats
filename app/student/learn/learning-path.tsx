"use client";

import { Dumbbell, Lock, Plus } from "lucide-react";
import { motion } from "motion/react";
import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect } from "react";
import { DuoButton } from "@/components/duo";
import { DuoCard, DuoCardHeader } from "@/components/duo";
import { WorkoutNode } from "@/components/organisms/workout/workout-node";
import { UnitSectionCard } from "@/components/ui/unit-section-card";
import { useLoadPrioritized } from "@/hooks/use-load-prioritized";
import { useModalState, useModalStateWithParam } from "@/hooks/use-modal-state";
import { useStudent } from "@/hooks/use-student";
import { apiClient } from "@/lib/api/client";
import type { PlanSlotData, WeeklyPlanData } from "@/lib/types";
import { useWorkoutStore } from "@/stores/workout-store";
import { useToast } from "@/hooks/use-toast";
import { StaggerContainer } from "../../../components/animations/stagger-container";
import { StaggerItem } from "../../../components/animations/stagger-item";

interface LearningPathProps {
  onLessonSelect: (lessonId: string) => void;
}

export function LearningPath({ onLessonSelect }: LearningPathProps) {
  const workoutModal = useModalStateWithParam("workout", "workoutId");
  const editPlanModal = useModalState("edit-plan");
  const [, setExerciseIndexParam] = useQueryState(
    "exerciseIndex",
    parseAsInteger,
  );
  const { toast } = useToast();

  useLoadPrioritized({ context: "learn" });

  const weeklyPlan = useStudent("weeklyPlan");
  const { loadWeeklyPlan } = useStudent("loaders");

  useEffect(() => {
    const handleWorkoutCompleted = async (event: Event) => {
      const customEvent = event as CustomEvent<{ workoutId?: string }>;
      const { workoutId } = customEvent.detail || {};

      if (!workoutId) return;

      const store = useWorkoutStore.getState();
      store.completeWorkout(workoutId);

      try {
        await loadWeeklyPlan(true);
      } catch (error) {
        console.error("[LearningPath] Erro ao recarregar plano:", error);
      }
    };

    window.addEventListener("workoutCompleted", handleWorkoutCompleted);
    return () => {
      window.removeEventListener("workoutCompleted", handleWorkoutCompleted);
    };
  }, [loadWeeklyPlan]);

  const handleWorkoutClick = (
    workoutId: string,
    isLocked: boolean,
    workoutType?: string,
    exerciseIndex?: number,
  ) => {
    if (isLocked) return;

    if (workoutModal.paramValue === workoutId) {
      workoutModal.close();
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

  const hasPlan = weeklyPlan && weeklyPlan.slots?.length >= 7;

  if (!hasPlan) {
    return (
      <>
        <EmptyWorkoutState
          onCreatePlan={async () => {
            try {
              await apiClient.post("/api/workouts/weekly-plan", {});
              await loadWeeklyPlan(true);
              editPlanModal.open();
            } catch (error) {
              toast({
                title: "Erro",
                description: "Não foi possível criar o plano.",
                variant: "destructive",
              });
            }
          }}
        />
      </>
    );
  }

  const positions: Array<"left" | "center" | "right"> = [
    "center",
    "left",
    "right",
    "center",
    "left",
    "right",
    "center",
  ];

  return (
    <div className="relative mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <UnitSectionCard
          sectionLabel={
            weeklyPlan!.description?.trim() || "7 dias • Segunda a Domingo"
          }
          title={weeklyPlan!.title}
          onButtonClick={() => editPlanModal.open()}
        />
      </div>

      <StaggerContainer className="relative flex flex-col items-center space-y-6">
        {weeklyPlan!.slots.map((slot: PlanSlotData, index: number) => {
          const position = positions[index % 7];

          if (slot.type === "rest" || !slot.workout) {
            return (
              <StaggerItem key={slot.id} className="relative w-full">
                <WorkoutNode variant="rest" position={position} />
              </StaggerItem>
            );
          }

          const workout = slot.workout;
          const isFirst = index === 0;
          const previousSlots = weeklyPlan!.slots.slice(0, index);
          const previousWorkouts = previousSlots
            .filter((s: PlanSlotData) => s.type === "workout" && s.workout)
            .map((s: PlanSlotData) => s.workout!);

          return (
            <StaggerItem key={slot.id} className="relative w-full">
              <WorkoutNode
                workout={{
                  ...workout,
                  locked: slot.locked,
                  completed: slot.completed,
                }}
                position={position}
                onClick={(isLocked) => {
                  handleWorkoutClick(workout.id, isLocked, workout.type);
                }}
                isFirst={isFirst}
                previousWorkouts={previousWorkouts}
                previousUnitsWorkouts={[]}
              />
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}

function EmptyWorkoutState({ onCreatePlan }: { onCreatePlan: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-duo-text">Treinos</h1>
        <p className="text-sm text-duo-gray-dark">
          Crie seu plano semanal (7 dias)
        </p>
      </div>

      <DuoCard variant="default" padding="md">
        <DuoCardHeader>
          <div className="flex items-center gap-2">
            <Dumbbell
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-[var(--duo-fg)]">
              Meu Plano Semanal
            </h2>
          </div>
        </DuoCardHeader>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="flex flex-col items-center justify-center space-y-4 py-8 text-center"
        >
          <Dumbbell className="h-12 w-12 text-duo-green" />
          <p className="text-lg font-bold text-gray-900">
            Comece a criar seus treinos!
          </p>
          <p className="text-sm text-gray-600">
            Plano de 7 dias (Seg-Dom) com treinos e dias de descanso. Crie
            manualmente ou use o Chat IA.
          </p>
          <DuoButton onClick={onCreatePlan} variant="primary" className="w-fit">
            <Plus className="mr-2 h-4 w-4" />
            Criar Plano Semanal
          </DuoButton>
        </motion.div>
      </DuoCard>
    </div>
  );
}
