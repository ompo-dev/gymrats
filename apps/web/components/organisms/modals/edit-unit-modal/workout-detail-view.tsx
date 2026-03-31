"use client";

import { Plus, Sparkles } from "lucide-react";
import { Reorder } from "motion/react";
import { DuoButton } from "@/components/duo";
import type { PlanSlotData, WorkoutExercise } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ExerciseEditCard } from "./exercise-edit-card";

const MUSCLE_CATEGORIES = [
  { value: "", label: "Nenhum", icon: "⚪" },
  { value: "peito", label: "Peito", icon: "🫁" },
  { value: "costas", label: "Costas", icon: "🏋️" },
  { value: "pernas", label: "Pernas", icon: "🦵" },
  { value: "ombros", label: "Ombros", icon: "💪" },
  { value: "bracos", label: "Braços", icon: "💪" },
  { value: "core", label: "Core", icon: "🔥" },
  { value: "gluteos", label: "Glúteos", icon: "🍑" },
  { value: "cardio", label: "Cardio", icon: "❤️" },
  { value: "funcional", label: "Funcional", icon: "⚡" },
  { value: "full_body", label: "Corpo Inteiro", icon: "💪" },
] as const;

export interface WorkoutDetailViewProps {
  workoutTitle: string;
  workoutMuscleGroup: string;
  onWorkoutTitleChange: (value: string) => void;
  onWorkoutTitleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onMuscleGroupChange: (value: string) => void;
  activeWorkoutId: string | null;
  calculatedEstimatedTime: number;
  exerciseItems: WorkoutExercise[];
  onReorderExercises: (newOrder: WorkoutExercise[]) => void;
  onUpdateExercise: (
    exerciseId: string,
    data: Partial<WorkoutExercise>,
  ) => void;
  onAddExercise: () => void;
  onDeleteExercise: (exerciseId: string) => void;
  isWeeklyPlanMode: boolean;
  weeklyPlan: { id: string } | null;
  planSlots: PlanSlotData[];
  onOpenSlotChat: (slotId: string) => void;
  onOpenWorkoutChat: () => void;
}

export function WorkoutDetailView({
  workoutTitle,
  workoutMuscleGroup,
  onWorkoutTitleChange,
  onWorkoutTitleBlur,
  onMuscleGroupChange,
  activeWorkoutId,
  calculatedEstimatedTime,
  exerciseItems,
  onReorderExercises,
  onUpdateExercise,
  onAddExercise,
  onDeleteExercise,
  isWeeklyPlanMode,
  weeklyPlan,
  planSlots,
  onOpenSlotChat,
  onOpenWorkoutChat,
}: WorkoutDetailViewProps) {
  const slotForActiveWorkout =
    activeWorkoutId && planSlots.find((s) => s.workout?.id === activeWorkoutId);

  return (
    <div className="space-y-6">
      <div className="bg-duo-bg-card p-6 rounded-2xl shadow-sm border border-duo-border space-y-4">
        <div>
          <label
            htmlFor="workout-detail-title"
            className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider mb-2 block"
          >
            Título do Dia
          </label>
          <input
            id="workout-detail-title"
            type="text"
            value={workoutTitle}
            onChange={(e) => onWorkoutTitleChange(e.target.value)}
            onBlur={onWorkoutTitleBlur}
            className="w-full px-4 py-2 rounded-xl bg-duo-bg-elevated border border-duo-border focus:outline-none focus:ring-2 focus:ring-duo-green/20 focus:border-duo-green transition-all font-bold"
          />
        </div>
        <div>
          <p className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider mb-2 block">
            Grupo Muscular
          </p>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_CATEGORIES.map((category) => (
              <DuoButton
                key={category.value}
                type="button"
                variant="outline"
                onClick={() => onMuscleGroupChange(category.value)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs min-h-0",
                  workoutMuscleGroup === category.value
                    ? "border-duo-green bg-duo-green/10 text-duo-green shadow-[0_2px_0_#58A700]"
                    : "border-duo-border bg-duo-bg-card text-duo-text hover:border-duo-green/50",
                )}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </DuoButton>
            ))}
          </div>
        </div>
        {calculatedEstimatedTime > 0 && (
          <div className="rounded-xl bg-duo-green/10 border border-duo-green/20 p-3">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Tempo Estimado
            </div>
            <div className="text-lg font-bold text-duo-green">
              {calculatedEstimatedTime} min
            </div>
            <div className="text-xs text-duo-fg-muted mt-1">
              Calculado automaticamente baseado nos exercícios
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between px-1 mb-4">
        <h3 className="text-lg font-bold text-duo-text mb-2 md:mb-0">
          Exercícios
        </h3>
        <div className="flex items-center gap-2">
          {isWeeklyPlanMode &&
            activeWorkoutId &&
            weeklyPlan &&
            slotForActiveWorkout && (
              <DuoButton
                variant="outline"
                size="sm"
                onClick={() => onOpenSlotChat(slotForActiveWorkout.id)}
                className="gap-1.5 z-10 relative"
              >
                <Sparkles className="h-4 w-4" />
                Chat IA
              </DuoButton>
            )}
          {!isWeeklyPlanMode && (
            <DuoButton
              variant="outline"
              size="sm"
              onClick={onOpenWorkoutChat}
              className="gap-1.5 z-10 relative"
            >
              <Sparkles className="h-4 w-4" />
              Chat IA
            </DuoButton>
          )}
          <DuoButton
            size="sm"
            onClick={onAddExercise}
            className="bg-duo-green hover:bg-duo-green-dark text-white font-bold flex items-center gap-2 z-10 relative"
          >
            <Plus className="h-4 w-4" />
            Exercício
          </DuoButton>
        </div>
      </div>

      {exerciseItems.length > 0 ? (
        <Reorder.Group
          axis="y"
          values={exerciseItems}
          onReorder={onReorderExercises}
          className="space-y-3"
        >
          {exerciseItems.map((exercise, index) => (
            <ExerciseEditCard
              key={exercise.id}
              exercise={exercise}
              index={index}
              onUpdate={onUpdateExercise}
              onDelete={onDeleteExercise}
            />
          ))}
        </Reorder.Group>
      ) : (
        <div className="text-center py-12 text-duo-fg-muted">
          <p>Nenhum exercício neste dia.</p>
        </div>
      )}
    </div>
  );
}
