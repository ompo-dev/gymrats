"use client";

// ARQUIVO LIMPO - SEM COLORS

import { useEffect, useState } from "react";
import { ProgressRing } from "@/components/atoms/progress/progress-ring";
import { WorkoutNodeButton } from "@/components/ui/workout-node-button";
import type { WorkoutSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useWorkoutStore } from "@/stores/workout-store";

interface WorkoutNodeProps {
	workout: WorkoutSession;
	position: "left" | "center" | "right";
	onClick: (isLocked: boolean) => void; // Passa isLocked calculado
	isFirst?: boolean;
	previousWorkouts?: WorkoutSession[];
	previousUnitsWorkouts?: WorkoutSession[];
}

export function WorkoutNode({
	workout,
	position,
	onClick,
	isFirst = false,
	previousWorkouts = [],
	previousUnitsWorkouts = [],
}: WorkoutNodeProps) {
	// Usar useWorkoutStore apenas para progresso local durante execução
	const _workoutProgress = useWorkoutStore(
		(state) => state.workoutProgress[workout.id],
	);
	const { isWorkoutCompleted, isWorkoutInProgress, getWorkoutProgress } =
		useWorkoutStore();

	// Priorizar workout.completed do store unificado (vem do backend)
	// Mas também verificar estado otimista do useWorkoutStore para feedback imediato
	const isCompletedFromStore = workout.completed || false;
	const isCompletedOptimistic = isWorkoutCompleted(workout.id);
	const isCompleted = isCompletedFromStore || isCompletedOptimistic;

	// Verificar se workouts anteriores estão completos
	// Priorizar workout.completed do store unificado, com fallback para estado otimista
	const allPreviousInUnitCompleted =
		previousWorkouts.length === 0
			? true
			: previousWorkouts.every((prevWorkout) => {
					const prevCompleted = prevWorkout.completed || false;
					const prevOptimistic = isWorkoutCompleted(prevWorkout.id);
					return prevCompleted || prevOptimistic;
				});

	const allPreviousUnitsCompleted =
		previousUnitsWorkouts.length === 0
			? true
			: previousUnitsWorkouts.every((prevWorkout) => {
					const prevCompleted = prevWorkout.completed || false;
					const prevOptimistic = isWorkoutCompleted(prevWorkout.id);
					return prevCompleted || prevOptimistic;
				});

	// Calcular se está locked baseado em workouts anteriores completos
	// Priorizar estado otimista: se anteriores estão completos no store local, desbloquear
	const allPreviousCompleted = isFirst
		? previousUnitsWorkouts.length === 0 || allPreviousUnitsCompleted
		: allPreviousInUnitCompleted;

	// Se todos os workouts anteriores foram completados (otimista ou do backend), desbloquear
	// Caso contrário, usar workout.locked do backend
	const isLocked = allPreviousCompleted
		? false // Desbloquear se todos anteriores estão completos
		: workout.locked; // Usar locked do backend caso contrário

	const hasProgress = !isCompleted && isWorkoutInProgress(workout.id);
	const totalSeenExercises = !isCompleted ? getWorkoutProgress(workout.id) : 0;
	const targetProgressPercent =
		totalSeenExercises > 0 && workout.exercises.length > 0
			? Math.min(100, (totalSeenExercises / workout.exercises.length) * 100)
			: 0;

	const canShowProgress =
		(isFirst && previousUnitsWorkouts.length === 0) ||
		(isFirst && allPreviousUnitsCompleted) ||
		(!isFirst && allPreviousInUnitCompleted);

	const inProgress = !isCompleted && canShowProgress && hasProgress;

	const isCurrent = !isLocked && !isCompleted && !inProgress;

	const isInProgressState = inProgress && !isCompleted && !isLocked;

	const shouldShowProgress =
		!isCompleted && !isLocked && canShowProgress && (hasProgress || !isLocked);

	const [, forceUpdate] = useState(0);

	// Re-renderizar quando workoutProgress mudar (progresso local durante execução)
	useEffect(() => {
		forceUpdate((prev) => prev + 1);
	}, []);

	// Escutar eventos de workout completado para atualizar UI imediatamente (estado otimista)
	// O store unificado será atualizado via loadWorkouts() no learning-path
	useEffect(() => {
		const handleWorkoutCompleted = (event: CustomEvent) => {
			const { workoutId } = event.detail || {};
			if (!workoutId) return;

			// Se qualquer workout anterior foi completado, re-renderizar para desbloquear
			const previousWorkoutIds = [
				...previousWorkouts.map((w) => w.id),
				...previousUnitsWorkouts.map((w) => w.id),
			];

			if (previousWorkoutIds.includes(workoutId) || workoutId === workout.id) {
				// Forçar re-render imediatamente para atualizar UI
				forceUpdate((prev) => prev + 1);
			}
		};

		const handleProgressUpdate = (event: CustomEvent) => {
			if (event.detail?.workoutId === workout.id) {
				forceUpdate((prev) => prev + 1);
			}
		};

		window.addEventListener(
			"workoutCompleted",
			handleWorkoutCompleted as EventListener,
		);
		window.addEventListener(
			"workoutProgressUpdate",
			handleProgressUpdate as EventListener,
		);

		return () => {
			window.removeEventListener(
				"workoutCompleted",
				handleWorkoutCompleted as EventListener,
			);
			window.removeEventListener(
				"workoutProgressUpdate",
				handleProgressUpdate as EventListener,
			);
		};
	}, [workout.id, previousWorkouts, previousUnitsWorkouts]);

	const getPositionClasses = () => {
		if (position === "left") return "mr-auto ml-[20%]";
		if (position === "right") return "ml-auto mr-[20%]";
		return "mx-auto";
	};

	return (
		<div
			className={cn(
				"relative flex w-fit flex-col items-center gap-3",
				getPositionClasses(),
			)}
		>
			{isFirst && isCurrent && (
				<div
					className="absolute -top-[72.59px] left-1/2 -translate-x-1/2 z-20"
					style={{ minWidth: "80px" }}
				>
					<div className="relative">
						<div
							className="flex items-center justify-center bg-white border-2 border-[#E5E5E5] rounded-[10px]"
							style={{
								padding: "14.6px 15.24px 13.4px 14px",
								width: "81.24px",
								height: "45px",
							}}
						>
							<span
								className="font-bold text-center uppercase text-[#58CC02]"
								style={{
									width: "52px",
									height: "17px",
									fontSize: "15px",
									lineHeight: "17px",
									letterSpacing: "0.51px",
								}}
							>
								START
							</span>
						</div>
						<div
							className="absolute left-1/2 -translate-x-1/2"
							style={{
								width: "20px",
								height: "10px",
								left: "30.61px",
								top: "44.67px",
								transform: "translateX(-50%) rotate(180deg)",
							}}
						>
							<div
								className="absolute bg-white border-2 border-[#E5E5E5]"
								style={{
									width: "14.14px",
									height: "14.14px",
									left: "0px",
									bottom: "5.46px",
									borderRadius: "2px",
									transform: "rotate(-135deg)",
								}}
							/>
						</div>
					</div>
				</div>
			)}

			{shouldShowProgress ? (
				<ProgressRing
					key={`progress-${workout.id}-${targetProgressPercent}-${hasProgress}`}
					showProgress={shouldShowProgress}
					progressPercent={targetProgressPercent}
				>
					<WorkoutNodeButton
						onClick={() => onClick(isLocked)}
						isLocked={isLocked}
						isCompleted={isCompleted}
						isCurrent={isCurrent || isInProgressState}
					/>
				</ProgressRing>
			) : (
				<WorkoutNodeButton
					onClick={() => onClick(isLocked)}
					isLocked={isLocked}
					isCompleted={isCompleted}
					isCurrent={isCurrent}
				/>
			)}

			<div className="max-w-[200px] text-center">
				<p
					className={cn(
						"text-sm font-bold leading-tight",
						isLocked ? "text-[#afafaf]" : "text-[#3c3c3c]",
					)}
				>
					{workout.title}
				</p>
				{!isLocked && (
					<div className="mt-1.5 flex items-center justify-center gap-2 text-xs text-[#afafaf]">
						<span>{workout.exercises.length} exercícios</span>
						<span>•</span>
						<span>{workout.estimatedTime}min</span>
					</div>
				)}
			</div>
		</div>
	);
}
