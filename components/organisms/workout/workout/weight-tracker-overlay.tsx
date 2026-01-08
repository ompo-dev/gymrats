"use client";

import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Progress } from "@/components/atoms/progress/progress";
import { WeightTracker } from "../../trackers/weight-tracker";
import type { WorkoutExercise, ExerciseLog } from "@/lib/types";

interface WeightTrackerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  exercise: WorkoutExercise;
  progress: number;
  currentExercise: number;
  totalExercises: number;
  onComplete: (log: ExerciseLog) => void;
}

export function WeightTrackerOverlay({
  isOpen,
  onClose,
  exerciseName,
  exercise,
  progress,
  currentExercise,
  totalExercises,
  onComplete,
}: WeightTrackerOverlayProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 z-60 flex h-screen flex-col bg-white overflow-hidden"
      >
        <div className="border-b-2 border-duo-border bg-white p-4 shadow-sm shrink-0">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={onClose}
              className="rounded-xl p-2 transition-colors hover:bg-gray-100"
            >
              <X className="h-6 w-6 text-duo-gray-dark" />
            </button>
            <div className="text-sm font-bold text-duo-gray-dark">
              Exercício {currentExercise} /{totalExercises}
            </div>
            <div className="w-6" />
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
          <WeightTracker
            exerciseName={exerciseName}
            exerciseId={exercise.id}
            defaultSets={exercise.sets}
            defaultReps={exercise.reps}
            onComplete={onComplete}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
