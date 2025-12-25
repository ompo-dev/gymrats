"use client";

import { X, Heart } from "lucide-react";
import { Progress } from "@/components/atoms/progress/progress";

interface WorkoutHeaderProps {
  onClose: () => void;
  hearts: number;
  currentExercise: number;
  totalExercises: number;
  progress: number;
}

export function WorkoutHeader({
  onClose,
  hearts,
  currentExercise,
  totalExercises,
  progress,
}: WorkoutHeaderProps) {
  return (
    <div className="border-b-2 border-duo-border bg-white p-3 sm:p-4 shadow-sm shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={onClose}
          className="rounded-xl p-2 transition-colors hover:bg-gray-100"
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6 text-duo-gray-dark" />
        </button>
        <div className="flex items-center gap-1 sm:gap-2">
          {Array.from({ length: hearts }).map((_, i) => (
            <Heart
              key={i}
              className="h-5 w-5 sm:h-6 sm:w-6 fill-duo-red text-duo-red"
            />
          ))}
        </div>
      </div>
      <div className="mb-2 flex items-center justify-between text-xs font-bold text-duo-gray-dark">
        <div className="flex items-center gap-2">
          <span>
            Exercício {currentExercise} de {totalExercises}
          </span>
        </div>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2 sm:h-3" />
    </div>
  );
}
