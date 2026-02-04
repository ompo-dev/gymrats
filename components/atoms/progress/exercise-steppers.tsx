"use client";

import { cn } from "@/lib/utils";

interface ExerciseSteppersProps {
	exerciseIds: string[]; // IDs reais dos exercícios na ordem do workout
	completedExerciseIds: string[]; // IDs dos exercícios completados
	skippedExerciseIds?: string[]; // IDs dos exercícios pulados (opcional)
	currentExerciseId?: string; // ID do exercício atual (para mostrar ring)
	className?: string;
}

export function ExerciseSteppers({
	exerciseIds,
	completedExerciseIds,
	skippedExerciseIds = [],
	currentExerciseId,
	className,
}: ExerciseSteppersProps) {
	return (
		<div className={cn("flex items-center gap-1.5 sm:gap-2", className)}>
			{exerciseIds.map((exerciseId, index) => {
				const isCompleted = completedExerciseIds.includes(exerciseId);
				const isSkipped = skippedExerciseIds?.includes(exerciseId);
				const isCurrent = currentExerciseId === exerciseId;

				// Determinar a cor do ring baseada no estado do exercício
				const ringColor = isCompleted
					? "ring-[#58CC02]" // Verde para completado
					: isSkipped
						? "ring-duo-orange/50" // Laranja/amarelo para pulado
						: "ring-gray-400"; // Cinza para não completado

				return (
					<div
						key={exerciseId}
						className={cn(
							"h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full transition-all duration-300 relative",
							isCompleted
								? "bg-[#58CC02] shadow-sm" // Verde para completado
								: isSkipped
									? "bg-duo-orange/50" // Laranja/amarelo para pulado
									: "bg-gray-300", // Cinza para não completado
							// Ring apenas no exercício atual com offset para destacar
							isCurrent &&
								`ring-2 ${ringColor} ring-offset-1 ring-offset-white`,
						)}
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
