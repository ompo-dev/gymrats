"use client";

import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect } from "react";
import { StudentLearningPathScreen } from "@/components/screens/student";
import { WorkoutNode } from "@/components/organisms/workout/workout-node";
import { useModalState, useModalStateWithParam } from "@/hooks/use-modal-state";
import { useStudent } from "@/hooks/use-student";
import { useStudentLearnBootstrapBridge } from "@/hooks/use-student-bootstrap";
import { useToast } from "@/hooks/use-toast";
import type { PlanSlotData, WeeklyPlanData } from "@/lib/types";
import { useWorkoutStore } from "@/stores/workout-store";
import { StaggerContainer } from "../../../components/animations/stagger-container";
import { StaggerItem } from "../../../components/animations/stagger-item";

interface LearningPathProps {
  onLessonSelect: (lessonId: string) => void;
}

export function LearningPath({ onLessonSelect }: LearningPathProps) {
  const workoutModal = useModalStateWithParam("workout", "workoutId");
  const editPlanModal = useModalState("edit-plan");
  const libraryModal = useModalState("training-library");
  const [, setExerciseIndexParam] = useQueryState(
    "exerciseIndex",
    parseAsInteger,
  );
  const { toast } = useToast();

  const { refetch: refetchLearnData } = useStudentLearnBootstrapBridge();

  const weeklyPlan = useStudent("weeklyPlan") as WeeklyPlanData | null;
  const { createWeeklyPlan } = useStudent("actions");

  useEffect(() => {
    const handleWorkoutCompleted = async (event: Event) => {
      const customEvent = event as CustomEvent<{ workoutId?: string }>;
      const { workoutId } = customEvent.detail || {};

      if (!workoutId) return;

      const store = useWorkoutStore.getState();
      store.completeWorkout(workoutId);

      try {
        await refetchLearnData();
      } catch (error) {
        console.error("[LearningPath] Erro ao recarregar plano:", error);
      }
    };

    window.addEventListener("workoutCompleted", handleWorkoutCompleted);
    return () => {
      window.removeEventListener("workoutCompleted", handleWorkoutCompleted);
    };
  }, [refetchLearnData]);

  const handleWorkoutClick = (
    workoutId: string,
    isLocked: boolean,
    _workoutType?: string,
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

  const slots: PlanSlotData[] = Array.isArray(weeklyPlan?.slots)
    ? (weeklyPlan.slots as unknown as PlanSlotData[])
    : [];
  const hasPlan = Boolean(weeklyPlan && slots.length >= 7);
  const todayIndex = (new Date().getDay() + 6) % 7;

  if (!hasPlan) {
    return (
      <StudentLearningPathScreen
        hasPlan={false}
        nodesSlot={null}
        onCreatePlan={async () => {
          try {
            await createWeeklyPlan();
            editPlanModal.open();
          } catch (_error) {
            toast({
              title: "Erro",
              description: "Nao foi possivel criar o plano.",
              variant: "destructive",
            });
          }
        }}
        onOpenLibrary={() => libraryModal.open()}
        sectionLabel="7 dias - Segunda a Domingo"
        title="Plano Semanal"
      />
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
    <StudentLearningPathScreen
      hasPlan
      nodesSlot={
        <StaggerContainer className="relative flex flex-col items-center space-y-6">
          {slots.map((slot: PlanSlotData, index: number) => {
            const position = positions[index % 7];
            const isToday = slot.dayOfWeek === todayIndex;
            const isPast = slot.dayOfWeek < todayIndex;
            const isFuture = slot.dayOfWeek > todayIndex;

            if (slot.type === "rest" || !slot.workout) {
              return (
                <StaggerItem key={slot.id} className="relative w-full">
                  <WorkoutNode.Simple variant="rest" position={position} />
                </StaggerItem>
              );
            }

            const workout = slot.workout;
            const isMissed = isPast && !slot.completed;

            return (
              <StaggerItem key={slot.id} className="relative w-full">
                <WorkoutNode.Simple
                  isDisabled={!isToday}
                  isMissed={isMissed}
                  lockOverride={isFuture}
                  onClick={(isLocked) => {
                    handleWorkoutClick(workout.id, isLocked, workout.type);
                  }}
                  position={position}
                  workout={{
                    ...workout,
                    completed: slot.completed,
                    locked: slot.locked,
                  }}
                />
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      }
      onCreatePlan={() => undefined}
      onOpenLibrary={() => libraryModal.open()}
      sectionLabel={
        (typeof weeklyPlan?.description === "string"
          ? weeklyPlan.description.trim()
          : "") || "7 dias - Segunda a Domingo"
      }
      title={
        typeof weeklyPlan?.title === "string"
          ? weeklyPlan.title
          : "Plano Semanal"
      }
    />
  );
}
