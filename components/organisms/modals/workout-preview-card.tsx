"use client";

import { ChevronDown, Dumbbell, MessageSquare } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { cn } from "@/lib/utils";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: number;
  notes?: string;
  alternatives?: string[];
}

interface WorkoutPreviewCardProps {
  workout: {
    title: string;
    description?: string;
    type: "strength" | "cardio" | "flexibility";
    muscleGroup: string;
    difficulty: "iniciante" | "intermediario" | "avancado";
    exercises: Array<Exercise>;
  };
  index: number;
  /** Último workout e ainda em streaming: mantém expandido para ver exercícios em tempo real */
  defaultExpanded?: boolean;
  /** Em streaming com 0 exercícios: mostra área de exercícios com placeholder */
  isStreaming?: boolean;
  onReference?: (
    type: "workout" | "exercise",
    workoutIndex: number,
    exerciseIndex?: number,
  ) => void;
}

interface ExerciseItemCardProps {
  exercise: Exercise;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onReference?: () => void;
}

function ExerciseItemCard({
  exercise,
  index: _index,
  isExpanded,
  onToggle,
  onReference,
}: ExerciseItemCardProps) {
  const hasDetails =
    exercise.notes ||
    (exercise.alternatives && exercise.alternatives.length > 0);

  const handleReference = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReference) {
      onReference();
    }
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation apenas, não é ação principal
    // biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation não requer teclado
    <div className="transition-all" onClick={(e) => e.stopPropagation()}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: role condicional quando hasDetails */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (hasDetails) onToggle();
        }}
        className={cn(
          "w-full rounded-xl border-2 p-3 text-left transition-all active:scale-[0.98]",
          hasDetails && "cursor-pointer",
          isExpanded
            ? "border-duo-green bg-duo-green/5 shadow-sm"
            : "border-gray-300 bg-white hover:border-duo-green hover:shadow-sm",
        )}
        role={hasDetails ? "button" : undefined}
        tabIndex={hasDetails ? 0 : undefined}
        onKeyDown={(e) => {
          if (hasDetails && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Dumbbell className="h-4 w-4 text-duo-green shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="font-bold text-gray-900">{exercise.name}</div>
                {onReference && (
                  <button
                    type="button"
                    onClick={handleReference}
                    className="shrink-0 text-duo-green hover:text-duo-green/80 transition-colors"
                    title="Referenciar este exercício"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-600">
                {exercise.sets} séries × {exercise.reps} reps
                {exercise.rest && ` • ${exercise.rest}s descanso`}
              </div>
            </div>
          </div>
          {hasDetails && (
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform duration-300 shrink-0",
                isExpanded && "rotate-180",
              )}
            />
          )}
        </div>

        <AnimatePresence>
          {isExpanded && hasDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-3 border-t border-gray-300 pt-3 space-y-3">
                {exercise.notes && (
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.2 }}
                  >
                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">
                      Notas
                    </div>
                    <div className="text-sm text-gray-700">
                      {exercise.notes}
                    </div>
                  </motion.div>
                )}

                {exercise.alternatives && exercise.alternatives.length > 0 && (
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.2 }}
                  >
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">
                      Alternativas ({exercise.alternatives.length})
                    </div>
                    <div className="space-y-1.5">
                      {exercise.alternatives.map((alt, altIdx) => (
                        <div
                          key={alt}
                          className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200"
                        >
                          {altIdx + 1}. {alt}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function WorkoutPreviewCard({
  workout,
  index,
  defaultExpanded = false,
  isStreaming = false,
  onReference,
}: WorkoutPreviewCardProps) {
  const [userToggled, setUserToggled] = useState(false);
  const [userExpanded, setUserExpanded] = useState(false);
  const isExpanded = userToggled ? userExpanded : defaultExpanded;
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState<
    number | null
  >(null);
  const hasExercises = workout.exercises.length > 0;
  const showExercisesArea = hasExercises || (isStreaming && defaultExpanded);

  const handleWorkoutReference = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReference) {
      onReference("workout", index);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <DuoCard
        variant="default"
        className={cn(
          "group transition-colors bg-white",
          (hasExercises || showExercisesArea) &&
            "cursor-pointer hover:border-duo-green/50 active:scale-[0.98]",
        )}
        onClick={
          hasExercises || showExercisesArea
            ? () => {
                setUserToggled(true);
                setUserExpanded((p) => !p);
              }
            : undefined
        }
      >
        {/* Número do workout e conteúdo na mesma div */}
        <div className="flex items-start gap-4">
          {/* Número do workout */}
          <div className="flex-none flex items-center justify-center w-10 h-10 rounded-2xl bg-duo-green/10 text-duo-green font-bold text-lg">
            {index + 1}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-900 text-lg">
                    {workout.title}
                  </h4>
                  {onReference && (
                    <button
                      type="button"
                      onClick={handleWorkoutReference}
                      className="shrink-0 text-duo-green hover:text-duo-green/80 transition-colors"
                      title="Referenciar este treino"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {workout.exercises.length} exercícios • {workout.muscleGroup}
                </p>
              </div>
              {(hasExercises || showExercisesArea) && (
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 text-gray-400"
                >
                  <ChevronDown className="h-5 w-5" />
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de exercícios - Accordion */}
        <AnimatePresence>
          {isExpanded && showExercisesArea && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {/* biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation apenas */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation não requer teclado */}
              <div
                className="mt-4 space-y-2 border-t border-gray-300 pt-4"
                onClick={(e) => e.stopPropagation()}
              >
                {!hasExercises && isStreaming ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-duo-green border-t-transparent" />
                    Adicionando exercícios...
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {workout.exercises.map((exercise, exIdx) => (
                      <motion.div
                        key={`${exercise.name}-${exIdx}`}
                        layout
                        initial={{ opacity: 0, y: -10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{
                          opacity: 0,
                          scale: 0.7,
                          height: 0,
                          y: -10,
                          transition: {
                            duration: 0.25,
                            ease: [0.34, 1.56, 0.64, 1],
                            height: { duration: 0.2 },
                          },
                        }}
                        transition={{
                          delay: exIdx * 0.05,
                          duration: 0.2,
                          layout: { duration: 0.2 },
                        }}
                      >
                        <ExerciseItemCard
                          exercise={exercise}
                          index={exIdx}
                          isExpanded={expandedExerciseIndex === exIdx}
                          onToggle={() =>
                            setExpandedExerciseIndex(
                              expandedExerciseIndex === exIdx ? null : exIdx,
                            )
                          }
                          onReference={
                            onReference
                              ? () => onReference("exercise", index, exIdx)
                              : undefined
                          }
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DuoCard>
    </motion.div>
  );
}
