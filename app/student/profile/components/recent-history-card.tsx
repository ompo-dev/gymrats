"use client";

import { Calendar, Play } from "lucide-react";
import { motion } from "motion/react";
import { DuoButton, DuoCard } from "@/components/duo";
import { HistoryCard } from "@/components/ui/history-card";
import type { WorkoutHistory } from "@/lib/types";

export interface RecentHistoryCardProps {
	workouts: WorkoutHistory[];
	lastInProgressWorkout: { workout: { id: string }; progress: { exerciseLogs?: unknown[] } } | null;
	onWorkoutClick: () => void;
}

export function RecentHistoryCard({
	workouts,
	lastInProgressWorkout,
	onWorkoutClick,
}: RecentHistoryCardProps) {
	return (
		<DuoCard.Root variant="default" padding="md">
			<DuoCard.Header>
				<div className="flex items-center gap-2">
					<Calendar
						className="h-5 w-5 shrink-0"
						style={{ color: "var(--duo-secondary)" }}
						aria-hidden
					/>
					<h2 className="font-bold text-[var(--duo-fg)]">Histórico Recente</h2>
				</div>
			</DuoCard.Header>
			{workouts.length > 0 ? (
				<div className="space-y-3">
					{workouts.map((workout) => (
						<div key={`${workout.workoutId}-${String(workout.date)}`}>
							<HistoryCard.Simple
								title={workout.workoutName}
								date={workout.date}
								status={
									workout.overallFeedback === "excelente"
										? "excelente"
										: workout.overallFeedback === "bom"
											? "bom"
											: "regular"
								}
								metadata={[
									{ icon: "⏱️", label: `${workout.duration} min` },
									{
										icon: "💪",
										label: `${workout.totalVolume.toLocaleString()} kg`,
									},
									{
										icon: "🏋️",
										label: `${workout.exercises.length} exercício${
											workout.exercises.length !== 1 ? "s" : ""
										}`,
									},
								]}
							/>
							{lastInProgressWorkout && workout.exercises.length > 0 && (
								<div className="mt-2 ml-4 space-y-1">
									{workout.exercises.map((exercise) => (
										<div
											key={exercise.id}
											className="text-sm text-duo-gray-dark flex items-center gap-2"
										>
											<span className="text-duo-green">✓</span>
											<span>{exercise.exerciseName}</span>
											{exercise.sets && exercise.sets.length > 0 && (
												<span className="text-xs text-duo-gray">
													({exercise.sets.length} séries)
												</span>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					))}
				</div>
			) : (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex flex-col items-center justify-center py-8 px-4 text-center"
				>
					<Play className="h-12 w-12 text-duo-gray-dark mb-4 opacity-50" />
					<h3 className="text-lg font-bold text-duo-text mb-2">
						Hora de começar!
					</h3>
					<p className="text-sm text-duo-gray-dark mb-4 max-w-sm">
						Complete seu primeiro treino para ver seu histórico aqui. Vamos
						começar com algo fácil e tranquilo!
					</p>
					<DuoButton
						onClick={onWorkoutClick}
						variant="primary"
						className="w-full max-w-xs"
					>
						<Play className="h-4 w-4 mr-2" />
						Primeiro Treino
					</DuoButton>
				</motion.div>
			)}
		</DuoCard.Root>
	);
}
