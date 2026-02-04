"use client";

import { BookOpen, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import type { WorkoutExercise } from "@/lib/types";

interface ExerciseCardViewProps {
	exercise: WorkoutExercise;
	exerciseName: string;
	hasAlternative: boolean;
	isCardio: boolean;
	elapsedTime: number;
	xpPerExercise: number;
	onViewEducation?: (educationalId: string) => void;
	isCompleted?: boolean; // Se o exercício já foi completado
	completedSetsCount?: number; // Número de séries completadas
}

export function ExerciseCardView({
	exercise,
	exerciseName,
	hasAlternative,
	isCardio,
	elapsedTime,
	xpPerExercise,
	onViewEducation,
	isCompleted = false,
	completedSetsCount = 0,
}: ExerciseCardViewProps) {
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs
			.toString()
			.padStart(2, "0")}`;
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -20, scale: 0.95 }}
			transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
			className="mb-4 sm:mb-8 rounded-2xl sm:rounded-3xl border-2 border-duo-border bg-linear-to-br from-white to-gray-50 p-4 sm:p-6 lg:p-8 shadow-lg"
		>
			<div className="mb-4 sm:mb-6">
				<div className="flex items-center justify-center gap-2">
					<h1 className="text-center text-xl sm:text-2xl lg:text-3xl font-black text-duo-text wrap-break-words">
						{exerciseName}
					</h1>
					{isCompleted && (
						<CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-duo-green shrink-0" />
					)}
				</div>
				{isCompleted && (
					<div className="mt-2 flex justify-center">
						<span className="inline-flex items-center gap-1.5 rounded-full bg-duo-green/10 px-2.5 py-1 text-xs font-bold text-duo-green">
							<CheckCircle2 className="h-3.5 w-3.5" />
							{completedSetsCount}{" "}
							{completedSetsCount === 1 ? "série" : "séries"}
						</span>
					</div>
				)}
				{hasAlternative && !isCompleted && (
					<p className="mt-2 text-center text-sm text-duo-blue font-bold">
						✓ Alternativa selecionada
					</p>
				)}
			</div>

			<div className="space-y-3 sm:space-y-4">
				{isCardio ? (
					<>
						{/* Cronômetro Principal - CARDIO */}
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
					</>
				) : (
					<>
						{/* Séries e Repetições - FORÇA */}
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
									+{xpPerExercise}
								</div>
							</div>
						</div>
					</>
				)}

				{exercise.notes && (
					<div className="rounded-xl border-2 border-duo-blue bg-linear-to-br from-duo-blue/10 to-white p-3 sm:p-4">
						<div className="mb-1 flex items-center gap-2 text-xs sm:text-sm font-bold text-duo-blue">
							<span>💡</span>
							<span>Dica</span>
						</div>
						<p className="text-xs sm:text-sm text-duo-text wrap-break-words">
							{exercise.notes}
						</p>
					</div>
				)}

				{/* Link para conteúdo educacional */}
				{exercise.educationalId && onViewEducation && (
					<button
						onClick={() => {
							if (exercise.educationalId) {
								onViewEducation(exercise.educationalId);
							}
						}}
						className="w-full rounded-xl border-2 border-duo-green/30 bg-duo-green/5 p-3 text-left transition-all hover:border-duo-green/50 hover:bg-duo-green/10"
					>
						<div className="flex items-center gap-2">
							<BookOpen className="h-5 w-5 shrink-0 text-duo-green" />
							<div className="flex-1">
								<div className="text-xs sm:text-sm font-bold text-duo-green">
									Ver técnica detalhada
								</div>
								<div className="text-xs text-duo-gray-dark">
									Instruções completas, dicas e erros comuns
								</div>
							</div>
						</div>
					</button>
				)}
			</div>
		</motion.div>
	);
}
