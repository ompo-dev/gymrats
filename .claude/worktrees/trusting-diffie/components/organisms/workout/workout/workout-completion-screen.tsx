"use client";

import { ArrowRight, CheckCircle2, Timer, Weight, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { FadeIn } from "@/components/animations/fade-in";
import { Button } from "@/components/atoms/buttons/button";
import type { ExerciseLog, WorkoutSession } from "@/lib/types";

interface WorkoutCompletionScreenProps {
	workout: WorkoutSession;
	workoutData: {
		exerciseLogs: ExerciseLog[];
		xpEarned: number;
		totalTime?: number;
		totalCalories?: number;
		avgHeartRate?: number;
	};
	onClose: () => void;
	onRepeat: () => void;
}

export function WorkoutCompletionScreen({
	workout,
	workoutData,
	onClose,
	onRepeat,
}: WorkoutCompletionScreenProps) {
	// Debug: Log dos dados recebidos
	console.log("🎯 WorkoutCompletionScreen recebeu:", {
		totalLogs: workoutData.exerciseLogs.length,
		logs: workoutData.exerciseLogs.map((l) => ({
			name: l.exerciseName,
			id: l.id,
			sets: l.sets.length,
			type:
				l.exerciseName.toLowerCase().includes("cardio") ||
				l.exerciseName.toLowerCase().includes("bicicleta") ||
				l.exerciseName.toLowerCase().includes("corrida") ||
				l.exerciseName.toLowerCase().includes("pular")
					? "CARDIO"
					: "FORÇA",
		})),
	});

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs
			.toString()
			.padStart(2, "0")}`;
	};

	// Calcular volume total apenas de séries válidas
	const totalVolume = workoutData.exerciseLogs.reduce(
		(acc, log) =>
			acc +
			log.sets
				.filter((set) => set.weight > 0 && set.reps > 0)
				.reduce((setAcc, set) => setAcc + set.weight * set.reps, 0),
		0,
	);

	const isCardioWorkout = workoutData.totalTime !== undefined;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.3 }}
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
				onClick={onClose}
			>
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.9 }}
					transition={{ duration: 0.3 }}
					onClick={(e) => e.stopPropagation()}
					className="flex h-screen w-full max-h-screen flex-col items-center overflow-y-auto bg-linear-to-b from-white to-gray-50 p-4 sm:p-6"
				>
					<FadeIn delay={0.1}>
						<div className="mb-4 sm:mb-8 text-center">
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{
									type: "spring",
									stiffness: 200,
									damping: 10,
									delay: 0.2,
								}}
								className="mb-4 sm:mb-6 text-6xl sm:text-8xl"
							>
								🎉
							</motion.div>
							<h1 className="mb-2 text-2xl sm:text-3xl lg:text-4xl font-black text-[#58CC02]">
								Treino Completo!
							</h1>
							<p className="text-sm sm:text-base lg:text-lg text-duo-gray-dark">
								Excelente trabalho hoje!
							</p>
						</div>
					</FadeIn>

					{/* Métricas */}
					<div className="mb-4 sm:mb-8 grid w-full max-w-md grid-cols-2 gap-3 sm:gap-4">
						{isCardioWorkout ? (
							<>
								<motion.div
									initial={{ opacity: 0, scale: 0.8, x: -20 }}
									animate={{ opacity: 1, scale: 1, x: 0 }}
									transition={{ delay: 0.3, duration: 0.4 }}
									whileHover={{ scale: 1.05 }}
									className="rounded-2xl border-2 border-duo-blue bg-duo-blue/20 p-4 sm:p-6 text-center shadow-lg"
								>
									<Timer className="mx-auto mb-2 h-5 w-5 sm:h-6 sm:w-6 text-duo-blue" />
									<div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
										Tempo Total
									</div>
									<div className="text-2xl sm:text-3xl font-black text-duo-blue">
										{formatTime(workoutData.totalTime!)}
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, scale: 0.8, x: 20 }}
									animate={{ opacity: 1, scale: 1, x: 0 }}
									transition={{ delay: 0.35, duration: 0.4 }}
									whileHover={{ scale: 1.05 }}
									className="rounded-2xl border-2 border-[#FFC800] bg-linear-to-br from-[#FFC800]/20 to-[#FF9600]/20 p-4 sm:p-6 text-center shadow-lg"
								>
									<Zap className="mx-auto mb-2 h-5 w-5 sm:h-6 sm:w-6 text-[#FFC800]" />
									<div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
										XP Ganho
									</div>
									<div className="text-2xl sm:text-3xl font-black text-[#FFC800]">
										{workout.xpReward}
									</div>
								</motion.div>
							</>
						) : (
							<>
								<motion.div
									initial={{ opacity: 0, scale: 0.8, x: -20 }}
									animate={{ opacity: 1, scale: 1, x: 0 }}
									transition={{ delay: 0.3, duration: 0.4 }}
									whileHover={{ scale: 1.05 }}
									className="rounded-2xl border-2 border-[#FFC800] bg-linear-to-br from-[#FFC800]/20 to-[#FF9600]/20 p-4 sm:p-6 text-center shadow-lg"
								>
									<div className="mb-2 flex items-center justify-center gap-2">
										<Zap className="h-5 w-5 sm:h-6 sm:w-6 text-[#FFC800]" />
									</div>
									<div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
										XP Ganho
									</div>
									<div className="text-2xl sm:text-3xl font-black text-[#FFC800]">
										{workout.xpReward}
									</div>
								</motion.div>

								<motion.div
									initial={{ opacity: 0, scale: 0.8, x: 20 }}
									animate={{ opacity: 1, scale: 1, x: 0 }}
									transition={{ delay: 0.35, duration: 0.4 }}
									whileHover={{ scale: 1.05 }}
									className="rounded-2xl border-2 border-[#1CB0F6] bg-linear-to-br from-[#1CB0F6]/20 to-[#58CC02]/20 p-4 sm:p-6 text-center shadow-lg"
								>
									<div className="mb-2 flex items-center justify-center gap-2">
										<Weight className="h-5 w-5 sm:h-6 sm:w-6 text-[#1CB0F6]" />
									</div>
									<div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
										Volume Total
									</div>
									<div className="text-2xl sm:text-3xl font-black text-[#1CB0F6]">
										{totalVolume.toFixed(0)}kg
									</div>
								</motion.div>
							</>
						)}
					</div>

					{/* Resumo dos exercícios */}
					{workoutData.exerciseLogs.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4, duration: 0.4 }}
							className="mb-4 sm:mb-6 w-full max-w-md space-y-2 sm:space-y-3"
						>
							<h3 className="text-base sm:text-lg font-bold text-duo-text">
								Resumo do Treino ({workoutData.exerciseLogs.length} exercícios)
							</h3>
							{workoutData.exerciseLogs.map((log, index) => {
								console.log(`📋 Renderizando exercício ${index + 1}:`, {
									name: log.exerciseName,
									id: log.id,
									sets: log.sets.length,
									type:
										log.exerciseName.toLowerCase().includes("cardio") ||
										log.exerciseName.toLowerCase().includes("bicicleta") ||
										log.exerciseName.toLowerCase().includes("corrida") ||
										log.exerciseName.toLowerCase().includes("pular")
											? "CARDIO"
											: "FORÇA",
								});
								return (
									<motion.div
										key={log.id}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
										whileHover={{ scale: 1.02, x: 5 }}
										className="rounded-xl border-2 border-duo-border bg-white p-3 sm:p-4 shadow-sm transition-all hover:shadow-md"
									>
										<div className="mb-2 flex items-center justify-between gap-2">
											<div className="font-bold text-duo-text text-sm sm:text-base wrap-break-words flex-1">
												{log.exerciseName}
											</div>
											<CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 fill-[#58CC02] text-white shrink-0" />
										</div>
										<div className="text-xs sm:text-sm text-duo-gray-dark">
											{
												log.sets.filter((set) => set.weight > 0 && set.reps > 0)
													.length
											}{" "}
											séries •{" "}
											{log.sets
												.filter((set) => set.weight > 0 && set.reps > 0)
												.reduce((acc, set) => acc + set.weight * set.reps, 0)
												.toFixed(0)}
											kg volume
										</div>
									</motion.div>
								);
							})}
						</motion.div>
					)}

					{/* Botões */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.6, duration: 0.4 }}
						className="flex w-full max-w-md gap-2 sm:gap-3 mb-4 sm:mb-0"
					>
						<Button
							variant="white"
							className="flex-1 text-sm sm:text-base"
							onClick={onRepeat}
						>
							FAZER NOVAMENTE
						</Button>
						<Button
							variant="default"
							className="flex-1 text-sm sm:text-base"
							onClick={onClose}
						>
							CONTINUAR
							<ArrowRight className="h-5 w-5" />
						</Button>
					</motion.div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
