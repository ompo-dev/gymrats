"use client";

import { ArrowRight, Dumbbell, Play } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/buttons/button";
import { DuoCard, DuoCardHeader } from "@/components/duo";
import type { Unit } from "@/lib/types";

interface ContinueWorkoutCardProps {
	units: Unit[];
	workoutHistory: any[];
}

export function ContinueWorkoutCard({
	units,
	workoutHistory,
}: ContinueWorkoutCardProps) {
	const router = useRouter();

	// Encontrar o primeiro workout não completado
	const findNextWorkout = () => {
		for (const unit of units) {
			if (unit.workouts && unit.workouts.length > 0) {
				const nextWorkout = unit.workouts.find(
					(workout) => !workout.completed && !workout.locked,
				);
				if (nextWorkout) {
					return {
						workout: nextWorkout,
						unitTitle: unit.title,
					};
				}
			}
		}
		return null;
	};

	// Encontrar o último workout completado
	const findLastCompletedWorkout = () => {
		if (workoutHistory.length === 0) return null;

		const lastWorkout = workoutHistory[0]; // Já está ordenado por data (mais recente primeiro)
		return lastWorkout;
	};

	const nextWorkout = findNextWorkout();
	const lastCompleted = findLastCompletedWorkout();

	// Se não houver próximo workout e não houver histórico, mostrar empty state
	if (!nextWorkout && !lastCompleted) {
		return (
			<DuoCard variant="default" padding="md">
				<DuoCardHeader>
					<div className="flex items-center gap-2">
						<Dumbbell className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
						<h2 className="font-bold text-[var(--duo-fg)]">Continue seu Treino</h2>
					</div>
				</DuoCardHeader>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, type: "spring" }}
					className="flex flex-col items-center justify-center space-y-4 py-6 text-center"
				>
					<Dumbbell className="h-10 w-10 text-duo-green" />
					<p className="text-base font-bold text-gray-900">
						Comece sua jornada!
					</p>
					<p className="text-sm text-gray-600">
						Seus treinos personalizados estão prontos. Comece agora!
					</p>
					<Button
						onClick={() => router.push("/student?tab=learn")}
						variant="default"
						className="w-fit"
					>
						<Play className="h-4 w-4 mr-2" />
						Ver Treinos
						<ArrowRight className="h-4 w-4 ml-2" />
					</Button>
				</motion.div>
			</DuoCard>
		);
	}

	// Se houver próximo workout, mostrar para continuar
	if (nextWorkout) {
		const workoutUrl = `/student?tab=learn&modal=workout&workoutId=${nextWorkout.workout.id}`;

		return (
			<DuoCard variant="default" padding="md">
				<DuoCardHeader>
					<div className="flex items-center gap-2">
						<Dumbbell className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
						<h2 className="font-bold text-[var(--duo-fg)]">Continue seu Treino</h2>
					</div>
				</DuoCardHeader>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, type: "spring" }}
					className="space-y-3"
				>
					<div className="flex items-start gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-duo-green/10 text-2xl">
							💪
						</div>
						<div className="flex-1">
							<p className="font-bold text-gray-900">
								{nextWorkout.workout.title}
							</p>
							<p className="text-xs text-gray-600">{nextWorkout.unitTitle}</p>
							{nextWorkout.workout.estimatedTime && (
								<p className="mt-1 text-xs text-gray-500">
									⏱️ {nextWorkout.workout.estimatedTime} min
								</p>
							)}
						</div>
					</div>
					<Button
						onClick={() => router.push(workoutUrl)}
						variant="default"
						className="w-full"
					>
						<Play className="h-4 w-4 mr-2" />
						Continuar Treino
						<ArrowRight className="h-4 w-4 ml-2" />
					</Button>
				</motion.div>
			</DuoCard>
		);
	}

	// Se não houver próximo workout mas houver histórico, mostrar último completado
	if (lastCompleted) {
		return (
			<DuoCard variant="default" padding="md">
				<DuoCardHeader>
					<div className="flex items-center gap-2">
						<Dumbbell className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
						<h2 className="font-bold text-[var(--duo-fg)]">Continue seu Treino</h2>
					</div>
				</DuoCardHeader>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, type: "spring" }}
					className="space-y-3"
				>
					<div className="flex items-start gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-duo-green/10 text-2xl">
							✅
						</div>
						<div className="flex-1">
							<p className="font-bold text-gray-900">
								Último treino: {lastCompleted.workoutName}
							</p>
							<p className="text-xs text-gray-600">
								{new Date(lastCompleted.date).toLocaleDateString("pt-BR", {
									day: "numeric",
									month: "long",
								})}
							</p>
						</div>
					</div>
					<Button
						onClick={() => router.push("/student?tab=learn")}
						variant="default"
						className="w-full"
					>
						<Play className="h-4 w-4 mr-2" />
						Ver Próximo Treino
						<ArrowRight className="h-4 w-4 ml-2" />
					</Button>
				</motion.div>
			</DuoCard>
		);
	}

	return null;
}
