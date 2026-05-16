"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ExerciseSteppers } from "@/components/atoms/progress/exercise-steppers";
import type { ExerciseLog, WorkoutExercise } from "@/lib/types";
import { WeightTracker } from "../../trackers/weight-tracker";

/** Garante que o log passado ao WeightTracker nunca tenha null/undefined em notes ou sets. */
function sanitizeExistingLog(
	log: ExerciseLog | null | undefined,
): ExerciseLog | null {
	if (log == null) return null;
	try {
		const sets = Array.isArray(log.sets)
			? log.sets
					.filter((s) => s != null)
					.map((s) => ({
						setNumber: s?.setNumber ?? 0,
						weight: s?.weight ?? 0,
						reps: s?.reps ?? 0,
						completed: s?.completed ?? false,
						notes: s?.notes ?? undefined,
						rpe: s?.rpe,
					}))
			: [];
		return {
			...log,
			sets,
			notes: typeof log.notes === "string" ? log.notes : "",
		};
	} catch {
		return null;
	}
}

interface WeightTrackerOverlayProps {
	isOpen: boolean;
	onClose: () => void;
	exerciseName: string;
	exercise: WorkoutExercise;
	progress: number;
	currentExercise: number;
	totalExercises: number;
	exerciseIds: string[]; // IDs dos exercícios na ordem do workout
	completedExerciseIds: string[]; // IDs dos exercícios completados
	skippedExerciseIds?: string[]; // IDs dos exercícios pulados (opcional)
	skippedIndices?: number[]; // Índices pulados (fallback quando ID não bate)
	currentExerciseId?: string; // ID do exercício atual (para mostrar ring)
	onComplete: (log: ExerciseLog) => void;
	onSaveProgress?: (log: ExerciseLog) => void; // Callback para salvar progresso sem fechar modal
	existingLog?: ExerciseLog | null; // Log existente do exercício (se já foi completado)
	isUnilateral?: boolean; // Se o exercício é unilateral
}

export function WeightTrackerOverlay({
	isOpen,
	onClose,
	exerciseName,
	exercise,
	progress: _progress,
	currentExercise,
	totalExercises,
	exerciseIds,
	completedExerciseIds,
	skippedExerciseIds = [],
	skippedIndices = [],
	currentExerciseId,
	onComplete,
	onSaveProgress,
	existingLog,
	isUnilateral = false,
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
							type="button"
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
					{/* Steppers ao invés de barra de progresso */}
					<ExerciseSteppers
						exerciseIds={exerciseIds}
						completedExerciseIds={completedExerciseIds}
						skippedExerciseIds={skippedExerciseIds}
						skippedIndices={skippedIndices}
						currentExerciseId={currentExerciseId}
						className="justify-center"
					/>
				</div>

				<div className="flex-1 overflow-y-auto scrollbar-hide p-6">
					<WeightTracker
						exerciseName={exerciseName}
						exerciseId={exercise.id}
						defaultSets={exercise.sets}
						defaultReps={exercise.reps}
						onComplete={onComplete}
						onSaveProgress={onSaveProgress}
						existingLog={sanitizeExistingLog(existingLog)}
						isUnilateral={isUnilateral}
					/>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
