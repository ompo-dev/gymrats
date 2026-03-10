"use client";

import { Edit2, GripVertical, Trash2 } from "lucide-react";
import { Reorder } from "motion/react";
import { DuoButton, DuoCard } from "@/components/duo";
import type { WorkoutSession } from "@/lib/types";

export interface WorkoutReorderItemProps {
  workout: WorkoutSession;
  index: number;
  onEdit: (workoutId: string) => void;
  onDelete: (workoutId: string) => void;
}

export function WorkoutReorderItem({
  workout,
  index,
  onEdit,
  onDelete,
}: WorkoutReorderItemProps) {
  return (
    <Reorder.Item
      value={workout}
      className="cursor-grab active:cursor-grabbing"
    >
      <DuoCard.Root
        variant="highlighted"
        className="group hover:border-duo-green/50 transition-colors bg-duo-bg-card"
      >
        <div className="flex items-center gap-4">
          <div className="flex-none cursor-grab active:cursor-grabbing text-duo-fg-muted hover:text-duo-green transition-colors">
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-none flex items-center justify-center w-10 h-10 rounded-2xl bg-duo-green/10 text-duo-green font-bold text-lg">
            {index + 1}
          </div>
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onEdit(workout.id)}
          >
            <h4 className="font-bold text-duo-text truncate text-lg">
              {workout.title}
            </h4>
            <p className="text-sm text-duo-fg-muted truncate">
              {workout.exercises.length} exercícios • {workout.muscleGroup}
            </p>
          </div>
          <div className="flex items-center gap-2 z-10 relative">
            <DuoButton
              variant="ghost"
              size="icon"
              className="text-duo-fg-muted hover:text-duo-green hover:bg-duo-green/10"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(workout.id);
              }}
              title="Editar dia de treino"
            >
              <Edit2 className="h-5 w-5" />
            </DuoButton>
            <DuoButton
              variant="ghost"
              size="icon"
              className="text-duo-fg-muted hover:text-duo-danger hover:bg-duo-danger/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(workout.id);
              }}
              title="Remover dia de treino"
            >
              <Trash2 className="h-5 w-5" />
            </DuoButton>
          </div>
        </div>
      </DuoCard.Root>
    </Reorder.Item>
  );
}
