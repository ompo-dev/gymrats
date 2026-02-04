"use client";

import { Calendar, Clock, Trophy } from "lucide-react";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { SectionCard } from "@/components/molecules/cards/section-card";
import type { WorkoutHistory } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecentWorkoutsCardProps {
	workoutHistory: WorkoutHistory[];
}

export function RecentWorkoutsCard({
	workoutHistory,
}: RecentWorkoutsCardProps) {
	const recentWorkouts = workoutHistory.slice(0, 3);

	if (recentWorkouts.length === 0) {
		return (
			<SectionCard
				icon={Calendar}
				title="Treinos Recentes"
				className="space-y-4"
			>
				<div className="py-4 text-center text-sm text-duo-gray-dark">
					Nenhum treino registrado ainda
				</div>
			</SectionCard>
		);
	}

	const getFeedbackColor = (feedback?: string) => {
		switch (feedback) {
			case "excelente":
				return "text-duo-green";
			case "bom":
				return "text-duo-blue";
			case "regular":
				return "text-duo-yellow";
			case "ruim":
				return "text-duo-red";
			default:
				return "text-duo-gray-dark";
		}
	};

	const formatDate = (date: Date | string) => {
		const d = typeof date === "string" ? new Date(date) : date;
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (d.toDateString() === today.toDateString()) {
			return "Hoje";
		}
		if (d.toDateString() === yesterday.toDateString()) {
			return "Ontem";
		}
		return d.toLocaleDateString("pt-BR", {
			day: "2-digit",
			month: "short",
		});
	};

	return (
		<SectionCard icon={Calendar} title="Treinos Recentes" className="space-y-3">
			<div className="space-y-2">
				{recentWorkouts.map((workout, index) => (
					<DuoCard key={index} variant="default" size="sm" className="p-3">
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<div className="mb-1 font-bold text-duo-text">
									{workout.workoutName}
								</div>
								<div className="flex items-center gap-3 text-xs text-duo-gray-dark">
									<div className="flex items-center gap-1">
										<Clock className="h-3 w-3" />
										{workout.duration} min
									</div>
									{workout.totalVolume > 0 && (
										<div className="flex items-center gap-1">
											<Trophy className="h-3 w-3" />
											{workout.totalVolume.toFixed(0)} kg
										</div>
									)}
								</div>
							</div>
							<div className="text-right">
								<div className="text-xs font-bold text-duo-gray-dark">
									{formatDate(workout.date)}
								</div>
								{workout.overallFeedback && (
									<div
										className={cn(
											"mt-1 text-xs font-bold",
											getFeedbackColor(workout.overallFeedback),
										)}
									>
										{workout.overallFeedback.charAt(0).toUpperCase() +
											workout.overallFeedback.slice(1)}
									</div>
								)}
							</div>
						</div>
					</DuoCard>
				))}
			</div>
		</SectionCard>
	);
}
