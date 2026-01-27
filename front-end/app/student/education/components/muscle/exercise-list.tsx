"use client";

import type { ExerciseInfo, MuscleGroup } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import { DuoCard } from "@/components/ui/duo-card";
import { SlideIn } from "@/components/animations/slide-in";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ExerciseListProps {
  exercises: ExerciseInfo[];
  exercisesByPrimaryMuscle: {
    muscleGroup: MuscleGroup;
    exercises: ExerciseInfo[];
  }[];
  searchQuery: string;
  onExerciseSelect: (exercise: ExerciseInfo) => void;
  muscleGroupLabels: Record<MuscleGroup, string>;
  getDifficultyClasses: (difficulty: string) => string;
}

export function ExerciseList({
  exercises,
  exercisesByPrimaryMuscle,
  searchQuery,
  onExerciseSelect,
  muscleGroupLabels,
  getDifficultyClasses,
}: ExerciseListProps) {
  if (exercises.length === 0) {
    return (
      <SlideIn delay={0.2}>
        <DuoCard variant="default" size="default">
          <div className="py-8 text-center text-duo-gray-dark">
            <p className="font-bold">Nenhum exercício encontrado</p>
            <p className="mt-1 text-sm">Tente buscar por outro termo</p>
          </div>
        </DuoCard>
      </SlideIn>
    );
  }

  if (searchQuery) {
    return (
      <SlideIn delay={0.2}>
        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <DuoCard
                variant="default"
                size="md"
                onClick={() => onExerciseSelect(exercise)}
                className="cursor-pointer transition-all hover:border-duo-green active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-bold text-duo-text">
                        {exercise.name}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-bold capitalize",
                          getDifficultyClasses(exercise.difficulty)
                        )}
                      >
                        {exercise.difficulty}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {exercise.primaryMuscles.map((muscle, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-duo-green/20 px-2 py-0.5 text-xs font-bold capitalize text-duo-green"
                        >
                          {muscleGroupLabels[muscle] || muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 shrink-0 text-duo-gray-dark" />
                </div>
              </DuoCard>
            </motion.div>
          ))}
        </div>
      </SlideIn>
    );
  }

  return (
    <SlideIn delay={0.2}>
      <div className="space-y-6">
        {exercisesByPrimaryMuscle.map(
          ({ muscleGroup, exercises: groupExercises }) => (
            <div key={muscleGroup} className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <h2 className="text-xl font-bold capitalize text-duo-text">
                  {muscleGroupLabels[muscleGroup]}
                </h2>
                <span className="rounded-full bg-duo-gray-dark/20 px-2 py-0.5 text-xs font-bold text-duo-gray-dark">
                  {groupExercises.length}
                </span>
              </motion.div>
              <div className="space-y-3">
                {groupExercises.map((exercise, index) => (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                  >
                    <DuoCard
                      variant="default"
                      size="md"
                      onClick={() => onExerciseSelect(exercise)}
                      className="cursor-pointer transition-all hover:border-duo-green active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="font-bold text-duo-text">
                              {exercise.name}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-bold capitalize",
                                getDifficultyClasses(exercise.difficulty)
                              )}
                            >
                              {exercise.difficulty}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {exercise.primaryMuscles.map((muscle, i) => (
                              <span
                                key={i}
                                className="rounded-full bg-duo-green/20 px-2 py-0.5 text-xs font-bold capitalize text-duo-green"
                              >
                                {muscleGroupLabels[muscle] || muscle}
                              </span>
                            ))}
                            {exercise.secondaryMuscles.length > 0 && (
                              <>
                                {exercise.secondaryMuscles
                                  .slice(0, 2)
                                  .map((muscle, i) => (
                                    <span
                                      key={`sec-${i}`}
                                      className="rounded-full bg-duo-blue/20 px-2 py-0.5 text-xs font-bold capitalize text-duo-blue"
                                    >
                                      {muscleGroupLabels[muscle] || muscle}
                                    </span>
                                  ))}
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-6 w-6 shrink-0 text-duo-gray-dark" />
                      </div>
                    </DuoCard>
                  </motion.div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </SlideIn>
  );
}
