"use client";

import type { WorkoutExercise } from "@/lib/types";

interface StrengthExerciseViewProps {
	exercise: WorkoutExercise;
	xpReward: number;
	totalExercises: number;
}

export function StrengthExerciseView({
	exercise,
	xpReward,
	totalExercises,
}: StrengthExerciseViewProps) {
	return (
		<div className="space-y-3 sm:space-y-4">
			{/* Séries e Repetições */}
			<div className="rounded-xl sm:rounded-2xl border-2 border-[#58CC02] bg-linear-to-br from-[#58CC02]/10 to-[#47A302]/10 p-4 sm:p-6 text-center">
				<div className="mb-2 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
					Séries e Repetições
				</div>
				<div className="text-3xl sm:text-4xl font-black text-[#58CC02]">
					{exercise.sets} x {exercise.reps}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:gap-4">
				<div className="rounded-xl border-2 border-duo-blue bg-linear-to-br from-duo-blue/10 to-white p-3 sm:p-4 text-center">
					<div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
						Descanso
					</div>
					<div className="text-xl sm:text-2xl font-black text-duo-blue">
						{exercise.rest}s
					</div>
				</div>
				<div className="rounded-xl border-2 border-duo-orange bg-linear-to-br from-duo-orange/10 to-white p-3 sm:p-4 text-center">
					<div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
						XP
					</div>
					<div className="text-xl sm:text-2xl font-black text-duo-orange">
						+{Math.round(xpReward / totalExercises)}
					</div>
				</div>
			</div>
		</div>
	);
}
