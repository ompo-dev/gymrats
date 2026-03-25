"use client";

import { GripVertical, Trash2 } from "lucide-react";
import { Reorder } from "motion/react";
import { DuoButton, DuoCard } from "@/components/duo";
import type { WorkoutExercise } from "@/lib/types";

export interface ExerciseEditCardProps {
  exercise: WorkoutExercise;
  index: number;
  onUpdate: (exerciseId: string, data: Partial<WorkoutExercise>) => void;
  onDelete: (exerciseId: string) => void;
}

export function ExerciseEditCard({
  exercise,
  index,
  onUpdate,
  onDelete,
}: ExerciseEditCardProps) {
  return (
    <Reorder.Item
      value={exercise}
      className="cursor-grab active:cursor-grabbing"
    >
      <DuoCard.Root
        variant="highlighted"
        size="md"
        className="group hover:border-duo-green/50 transition-all bg-duo-bg-card"
      >
        <div className="flex items-center gap-4">
          <div className="flex-none cursor-grab active:cursor-grabbing text-duo-fg-muted hover:text-duo-green transition-colors">
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-none flex items-center justify-center w-10 h-10 rounded-2xl bg-duo-green/10 text-duo-green font-bold text-lg shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              defaultValue={exercise.name ?? ""}
              onBlur={(e) => onUpdate(exercise.id, { name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-duo-bg-elevated border border-duo-border hover:bg-duo-bg-card hover:border-duo-border focus:bg-duo-bg-card focus:border-duo-green focus:outline-none focus:ring-2 focus:ring-duo-green/20 font-bold text-base transition-all"
              placeholder="Nome do exercício"
            />
          </div>
          <div className="flex-none z-10 relative">
            <DuoButton
              variant="ghost"
              size="icon"
              className="text-duo-fg-muted hover:text-duo-danger hover:bg-duo-danger/10 transition-colors"
              onClick={() => onDelete(exercise.id)}
              title="Remover exercício"
            >
              <Trash2 className="h-5 w-5" />
            </DuoButton>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="flex flex-col gap-1.5 bg-duo-bg-elevated rounded-xl p-3 border border-duo-border items-center justify-center">
            <label
              htmlFor={`exercise-${exercise.id}-sets`}
              className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider text-center w-full"
            >
              Séries
            </label>
            <input
              id={`exercise-${exercise.id}-sets`}
              type="number"
              defaultValue={exercise.sets ?? 0}
              onBlur={(e) =>
                onUpdate(exercise.id, {
                  sets: parseInt(e.target.value, 10) || 0,
                })
              }
              className="w-full bg-transparent font-bold text-duo-text text-center text-lg focus:outline-none border-b-2 border-transparent focus:border-duo-green transition-colors"
              min={0}
            />
          </div>
          <div className="flex flex-col gap-1.5 bg-duo-bg-elevated rounded-xl p-3 border border-duo-border items-center justify-center">
            <label
              htmlFor={`exercise-${exercise.id}-reps`}
              className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider text-center w-full"
            >
              Repetições
            </label>
            <input
              id={`exercise-${exercise.id}-reps`}
              type="text"
              defaultValue={exercise.reps ?? ""}
              onBlur={(e) => onUpdate(exercise.id, { reps: e.target.value })}
              className="w-full bg-transparent font-bold text-duo-text text-center text-lg focus:outline-none border-b-2 border-transparent focus:border-duo-green transition-colors"
              placeholder="8-12"
            />
          </div>
          <div className="flex flex-col gap-1.5 bg-duo-bg-elevated rounded-xl p-3 border border-duo-border items-center justify-center">
            <label
              htmlFor={`exercise-${exercise.id}-rest`}
              className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider text-center w-full"
            >
              Descanso
            </label>
            <div className="flex items-center justify-center gap-1">
              <input
                id={`exercise-${exercise.id}-rest`}
                type="number"
                defaultValue={exercise.rest ?? 0}
                onBlur={(e) =>
                  onUpdate(exercise.id, {
                    rest: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full bg-transparent font-bold text-duo-text text-center text-lg focus:outline-none border-b-2 border-transparent focus:border-duo-green transition-colors"
                min={0}
              />
              <span className="text-xs font-bold text-duo-fg-muted">s</span>
            </div>
          </div>
        </div>
      </DuoCard.Root>
    </Reorder.Item>
  );
}
