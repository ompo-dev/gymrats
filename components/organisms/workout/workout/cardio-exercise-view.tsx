"use client";

import type { WorkoutExercise } from "@/lib/types";

interface CardioExerciseViewProps {
	exercise: WorkoutExercise;
	elapsedTime: number;
	calories: number;
	heartRate: number;
	exerciseName: string;
	xpReward: number;
}

export function CardioExerciseView({
	exercise,
	elapsedTime,
	calories,
	heartRate,
	exerciseName,
	xpReward,
}: CardioExerciseViewProps) {
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs
			.toString()
			.padStart(2, "0")}`;
	};

	return (
		<div className="space-y-3 sm:space-y-4">
			{/* Cronômetro Principal */}
			<div className="rounded-xl sm:rounded-2xl border-2 border-duo-red bg-linear-to-br from-duo-red/10 to-duo-red/5 p-6 sm:p-8 text-center">
				<div className="mb-2 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
					Tempo
				</div>
				<div className="text-5xl sm:text-6xl font-black text-duo-red">
					{formatTime(elapsedTime)}
				</div>
				<div className="mt-3 text-sm text-duo-gray-dark">
					Meta: {exercise.reps}
				</div>
			</div>
		</div>
	);
}
