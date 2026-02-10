"use client";

import { cn } from "@/lib/utils";
import { StepperDot } from "./stepper-dot";

interface ExerciseSteppersProps {
	exerciseIds: string[];
	completedExerciseIds: string[];
	skippedExerciseIds?: string[];
	skippedIndices?: number[];
	currentExerciseId?: string;
	className?: string;
	size?: "default" | "sm" | "lg";
}

export function ExerciseSteppers({
	exerciseIds,
	completedExerciseIds,
	skippedExerciseIds = [],
	skippedIndices = [],
	currentExerciseId,
	className,
	size = "default",
}: ExerciseSteppersProps) {
	return (
		<div className={cn("flex items-center gap-1.5 sm:gap-2", className)}>
			{exerciseIds.map((exerciseId, index) => {
				const isCompleted = completedExerciseIds.includes(exerciseId);
				const isSkipped =
					skippedExerciseIds.includes(exerciseId) ||
					skippedIndices.includes(index);
				const isCurrent = currentExerciseId === exerciseId;

				const status = isCompleted
					? "completed"
					: isSkipped
						? "skipped"
						: "default";

				return (
					<StepperDot
						key={exerciseId}
						status={status}
						isCurrent={isCurrent}
						size={size}
						title={
							isCompleted
								? `Exercício ${index + 1} completado`
								: isSkipped
									? `Exercício ${index + 1} pulado`
									: `Exercício ${index + 1} não completado`
						}
					/>
				);
			})}
		</div>
	);
}
