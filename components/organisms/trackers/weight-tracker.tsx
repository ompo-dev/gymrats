"use client";

import { Check, Plus, TrendingUp, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ExerciseLog, SetLog } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WeightTrackerProps {
	exerciseName: string;
	exerciseId: string;
	defaultSets: number;
	defaultReps: string;
	onComplete: (log: ExerciseLog) => void;
	onSaveProgress?: (log: ExerciseLog) => void; // Callback opcional para salvar progresso sem fechar modal
	existingLog?: ExerciseLog | null; // Log existente do exercício (se já foi completado)
	isUnilateral?: boolean; // Se o exercício é unilateral (faz cada lado separadamente)
}

export function WeightTracker({
	exerciseName,
	exerciseId,
	defaultSets,
	defaultReps,
	onComplete,
	onSaveProgress,
	existingLog,
	isUnilateral = false,
}: WeightTrackerProps) {
	// Carregar dados existentes se houver, senão começar com 1 série vazia
	const [sets, setSets] = useState<SetLog[]>(() => {
		if (existingLog?.sets && existingLog.sets.length > 0) {
			// Carregar séries existentes
			return existingLog.sets.map((set) => ({
				setNumber: set.setNumber,
				weight: set.weight || 0,
				reps: set.reps || 0,
				completed: set.completed || false,
				notes: set.notes,
				rpe: set.rpe,
			}));
		}
		// Começar com apenas 1 série
		return [
			{
				setNumber: 1,
				weight: 0,
				reps: 0,
				completed: false,
			},
		];
	});
	const [notes, setNotes] = useState(existingLog?.notes || "");
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Atualizar dados quando existingLog mudar (ex: quando voltar para um exercício)
	useEffect(() => {
		// Se há log existente com séries, carregar
		if (existingLog?.sets && existingLog.sets.length > 0) {
			// Carregar séries existentes - garantir que todas as séries sejam carregadas
			const loadedSets = existingLog.sets.map((set) => ({
				setNumber: set.setNumber,
				weight: set.weight || 0,
				reps: set.reps || 0,
				completed: set.completed || false,
				notes: set.notes,
				rpe: set.rpe,
			}));

			console.log("🔄 WeightTracker carregando dados existentes:", {
				exerciseId,
				exerciseName,
				existingLogId: existingLog.id,
				setsCount: loadedSets.length,
				sets: loadedSets.map((s) => ({
					setNumber: s.setNumber,
					weight: s.weight,
					reps: s.reps,
					completed: s.completed,
				})),
			});

			setSets(loadedSets);
			setNotes(existingLog.notes || "");
		} else if (existingLog === null || existingLog === undefined) {
			// Resetar para estado inicial se não houver log
			console.log("🔄 WeightTracker resetando - sem log existente");
			setSets([
				{
					setNumber: 1,
					weight: 0,
					reps: 0,
					completed: false,
				},
			]);
			setNotes("");
		}
		// Dependências: existingLog e suas propriedades principais
	}, [
		existingLog?.id,
		existingLog?.sets?.length,
		exerciseId,
		existingLog.notes,
		existingLog.sets,
		existingLog,
		exerciseName,
	]);

	// Cleanup do timeout ao desmontar
	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, []);

	// Adicionar nova série
	const handleAddSet = () => {
		const newSet: SetLog = {
			setNumber: sets.length + 1,
			weight: 0,
			reps: 0,
			completed: false,
		};
		setSets([...sets, newSet]);
	};

	// Remover série (não permite remover se houver apenas 1)
	const handleRemoveSet = (index: number) => {
		if (sets.length <= 1) return;

		const newSets = sets.filter((_, i) => i !== index);
		// Renumerar as séries
		const renumberedSets = newSets.map((set, i) => ({
			...set,
			setNumber: i + 1,
		}));
		setSets(renumberedSets);
	};

	// Atualizar peso ou reps de uma série
	const handleSetUpdate = (
		index: number,
		field: "weight" | "reps",
		value: number,
	) => {
		const newSets = [...sets];
		const oldSet = newSets[index];
		newSets[index] = { ...newSets[index], [field]: value };
		setSets(newSets);

		// Se a série estava completa e agora tem valores válidos, salvar progresso
		// Isso permite atualizar séries já completadas
		if (oldSet.completed && value > 0) {
			// Limpar timeout anterior se existir
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
			// Debounce para não salvar a cada digitação (500ms)
			saveTimeoutRef.current = setTimeout(() => {
				saveProgress();
			}, 500);
		}
	};

	// Salvar progresso automaticamente (chamado quando completa série ou atualiza dados)
	// Esta função salva sem fechar o modal
	const saveProgress = () => {
		// Filtrar apenas séries válidas (com peso E reps preenchidos)
		const validSets = sets.filter((set) => set.weight > 0 && set.reps > 0);

		// Se não houver nenhuma série válida, não salvar
		if (validSets.length === 0) {
			return;
		}

		// Renumerar as séries válidas
		const finalSets = validSets.map((set, index) => ({
			...set,
			setNumber: index + 1,
		}));

		// Criar ou atualizar log
		const log: ExerciseLog = {
			id: existingLog?.id || Date.now().toString(),
			exerciseId,
			exerciseName,
			workoutId: existingLog?.workoutId || "current",
			date: existingLog?.date || new Date(),
			sets: finalSets,
			notes,
			difficulty: existingLog?.difficulty || "ideal",
			formCheckScore: existingLog?.formCheckScore,
		};

		console.log("💾 WeightTracker salvando progresso automático:", {
			exerciseName: log.exerciseName,
			logId: log.id,
			sets: log.sets.length,
			completedSets: log.sets.filter((s) => s.completed).length,
		});

		// Usar onSaveProgress se disponível (salva sem fechar modal), senão usar onComplete
		if (onSaveProgress) {
			onSaveProgress(log);
		} else {
			// Fallback para onComplete se onSaveProgress não estiver disponível
			onComplete(log);
		}
	};

	// Marcar série como completa e salvar progresso automaticamente
	const handleSetComplete = (index: number) => {
		const newSets = [...sets];
		newSets[index] = { ...newSets[index], completed: true };
		setSets(newSets);

		// Salvar progresso automaticamente quando completa uma série
		// Usar setTimeout para garantir que o estado foi atualizado
		setTimeout(() => {
			saveProgress();
		}, 0);
	};

	// Finalizar exercício - filtrar séries vazias
	const handleFinish = () => {
		console.log("🏋️ WeightTracker handleFinish CHAMADO:", {
			exerciseName,
			totalSets: sets.length,
			validSets: sets.filter((set) => set.weight > 0 && set.reps > 0).length,
			hasExistingLog: !!existingLog,
			existingLogId: existingLog?.id,
		});

		// Filtrar apenas séries válidas (com peso E reps preenchidos)
		const validSets = sets.filter((set) => set.weight > 0 && set.reps > 0);

		// Se não houver nenhuma série válida, não permite finalizar
		if (validSets.length === 0) {
			console.warn("⚠️ Nenhuma série válida! Não é possível finalizar.");
			return;
		}

		// Renumerar as séries válidas
		const finalSets = validSets.map((set, index) => ({
			...set,
			setNumber: index + 1,
		}));

		// Se já existe um log, manter o mesmo ID para atualizar ao invés de criar novo
		const log: ExerciseLog = {
			id: existingLog?.id || Date.now().toString(),
			exerciseId,
			exerciseName,
			workoutId: existingLog?.workoutId || "current",
			date: existingLog?.date || new Date(),
			sets: finalSets,
			notes,
			difficulty: existingLog?.difficulty || "ideal",
			formCheckScore: existingLog?.formCheckScore,
		};
		console.log("🏋️ WeightTracker chamando onComplete:", {
			exerciseName: log.exerciseName,
			logId: log.id,
			isUpdate: !!existingLog,
			sets: log.sets.length,
			setsDetails: log.sets.map((s) => ({
				setNumber: s.setNumber,
				weight: s.weight,
				reps: s.reps,
			})),
		});
		onComplete(log);
	};

	// Verificar se há pelo menos uma série válida para finalizar
	const hasValidSets = sets.some((set) => set.weight > 0 && set.reps > 0);

	// Calcular volume total apenas das séries válidas
	const totalVolume = sets
		.filter((set) => set.weight > 0 && set.reps > 0)
		.reduce((acc, set) => acc + set.weight * set.reps, 0);

	const isCompleted = existingLog?.sets && existingLog.sets.length > 0;

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h2 className="mb-2 text-2xl font-bold text-duo-text">
					{exerciseName}
				</h2>
				{isUnilateral && (
					<div className="mb-2 text-xs font-bold text-duo-blue uppercase tracking-wide">
						Exercício Unilateral
					</div>
				)}
				{isCompleted && (
					<div className="mb-2 flex justify-center">
						<span className="inline-flex items-center gap-1.5 rounded-full bg-duo-green/10 px-2.5 py-1 text-xs font-bold text-duo-green">
							<Check className="h-3.5 w-3.5" />
							Completado
						</span>
					</div>
				)}
				<div className="text-sm text-duo-gray-dark">
					Sugestão: {defaultSets} séries x {defaultReps} reps
				</div>
			</div>

			<div className="space-y-3">
				<AnimatePresence>
					{sets.map((set, index) => {
						const isValid = set.weight > 0 && set.reps > 0;
						const isEmpty = set.weight === 0 && set.reps === 0;

						return (
							<motion.div
								key={set.setNumber}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.2 }}
								className={cn(
									"rounded-2xl border-2 p-4 transition-all relative",
									set.completed
										? "border-duo-green bg-duo-green/10"
										: isValid
											? "border-duo-blue bg-duo-blue/10"
											: "border-duo-border bg-white",
								)}
							>
								<div className="mb-3 flex items-center justify-between">
									<div className="font-bold text-duo-text">
										Série {set.setNumber}
									</div>
									<div className="flex items-center gap-2">
										{set.completed && (
											<Check className="h-5 w-5 text-duo-green" />
										)}
										{sets.length > 1 && (
											<button
												onClick={() => handleRemoveSet(index)}
												className="rounded-lg p-1 text-duo-gray-dark hover:bg-red-100 hover:text-red-600 transition-colors"
												title="Remover série"
											>
												<X className="h-4 w-4" />
											</button>
										)}
									</div>
								</div>

								{!set.completed ? (
									<div className="grid grid-cols-2 gap-3">
										<div>
											<label className="mb-1 block text-xs font-bold text-duo-gray-dark">
												Carga (kg)
											</label>
											<input
												type="number"
												step="0.5"
												min="0"
												placeholder="0"
												value={set.weight || ""}
												className="w-full rounded-xl border-2 border-duo-border px-3 py-2 font-bold text-duo-text focus:border-duo-blue focus:outline-none"
												onChange={(e) => {
													const value = Number.parseFloat(e.target.value) || 0;
													handleSetUpdate(index, "weight", value);
												}}
											/>
										</div>
										<div>
											<label className="mb-1 block text-xs font-bold text-duo-gray-dark">
												Repetições
											</label>
											<input
												type="number"
												min="0"
												placeholder="0"
												value={set.reps || ""}
												className="w-full rounded-xl border-2 border-duo-border px-3 py-2 font-bold text-duo-text focus:border-duo-blue focus:outline-none"
												onChange={(e) => {
													const value =
														Number.parseInt(e.target.value, 10) || 0;
													handleSetUpdate(index, "reps", value);
												}}
											/>
										</div>
										{isValid && (
											<motion.button
												initial={{ opacity: 0, scale: 0.9 }}
												animate={{ opacity: 1, scale: 1 }}
												onClick={() => handleSetComplete(index)}
												className="duo-button-green col-span-2 flex items-center justify-center gap-2"
											>
												<Check className="h-5 w-5" />
												COMPLETAR SÉRIE
											</motion.button>
										)}
										{isEmpty && (
											<div className="col-span-2 text-center text-xs text-duo-gray-dark">
												Preencha peso e repetições para completar
											</div>
										)}
									</div>
								) : (
									<div className="flex items-center justify-between text-sm">
										<span className="text-duo-gray-dark">
											{set.weight}kg x {set.reps} reps
										</span>
										<span className="font-bold text-duo-green">
											{(set.weight * set.reps).toFixed(0)}kg volume
										</span>
									</div>
								)}
							</motion.div>
						);
					})}
				</AnimatePresence>

				{/* Botão para adicionar nova série */}
				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={handleAddSet}
					className="w-full rounded-2xl border-2 border-dashed border-duo-border bg-white py-4 font-bold text-duo-gray-dark transition-all hover:border-duo-blue hover:bg-duo-blue/5"
				>
					<Plus className="mr-2 inline h-5 w-5" />
					ADICIONAR SÉRIE
				</motion.button>
			</div>

			{/* Volume total (sempre visível se houver séries válidas) */}
			{totalVolume > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="rounded-2xl border-2 border-duo-yellow bg-duo-yellow/10 p-4"
				>
					<div className="mb-2 flex items-center gap-2">
						<TrendingUp className="h-5 w-5 text-duo-yellow" />
						<span className="font-bold text-duo-text">Volume Total</span>
					</div>
					<div className="text-3xl font-bold text-duo-yellow">
						{totalVolume.toFixed(0)} kg
					</div>
				</motion.div>
			)}

			{/* Notas */}
			<div>
				<label className="mb-2 block text-sm font-bold text-duo-gray-dark">
					Notas (opcional)
				</label>
				<textarea
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Como foi o treino? Sentiu alguma dificuldade?"
					className="w-full rounded-xl border-2 border-duo-border px-4 py-3 text-duo-text focus:border-duo-blue focus:outline-none"
					rows={3}
				/>
			</div>

			{/* Botão finalizar - aparece se houver pelo menos uma série válida */}
			{hasValidSets && (
				<motion.button
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={handleFinish}
					className="duo-button-green w-full text-lg"
				>
					FINALIZAR EXERCÍCIO
				</motion.button>
			)}
		</div>
	);
}
