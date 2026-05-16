"use client";

import { X } from "lucide-react";
import { ExerciseSteppers } from "@/components/atoms/progress/exercise-steppers";

interface WorkoutHeaderProps {
	onClose: () => void;
	hearts: number;
	currentExercise: number;
	totalExercises: number;
	progress: number;
	exerciseIds: string[];
	completedExerciseIds: string[];
	skippedExerciseIds?: string[];
	skippedIndices?: number[];
}

export function WorkoutHeader({
	onClose,
	hearts: _hearts,
	currentExercise,
	totalExercises,
	progress: _progress,
	exerciseIds,
	completedExerciseIds,
	skippedExerciseIds = [],
	skippedIndices = [],
}: WorkoutHeaderProps) {
	return (
		<div className="border-b-2 border-duo-border bg-white p-3 sm:p-4 shadow-sm shrink-0">
			<div className="mb-3 flex items-center justify-between">
				<button
					type="button"
					onClick={onClose}
					className="rounded-xl p-2 transition-colors hover:bg-gray-100"
					aria-label="Fechar workout"
				>
					<X className="h-5 w-5 sm:h-6 sm:w-6 text-duo-gray-dark" />
				</button>
			</div>
			<div className="mb-2 flex items-center justify-between text-xs font-bold text-duo-gray-dark">
				<div className="flex items-center gap-2">
					<span>
						Exercício {currentExercise} de {totalExercises}
					</span>
				</div>
			</div>
			<ExerciseSteppers
				exerciseIds={exerciseIds}
				completedExerciseIds={completedExerciseIds}
				skippedExerciseIds={skippedExerciseIds}
				skippedIndices={skippedIndices}
				currentExerciseId={exerciseIds[currentExercise - 1] || undefined}
				className="justify-center"
			/>
		</div>
	);
}
