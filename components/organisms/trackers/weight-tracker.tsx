"use client";

import { Check, Plus, TrendingUp, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DuoButton } from "@/components/duo";
import { DuoStatCard } from "@/components/duo";
import type { ExerciseLog, SetLog } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Lê propriedade 'notes' sem lançar (getters ou proxies podem acessar null). */
function getNotesSafe(log: unknown): string {
	try {
		if (log == null || typeof log !== "object") return "";
		const n = (log as Record<string, unknown>).notes;
		return typeof n === "string" ? n : "";
	} catch {
		return "";
	}
}

/** Normaliza log para evitar null/undefined em sets ou notes (dados inconsistentes). */
function normalizeExistingLog(
	log: ExerciseLog | null | undefined,
): ExerciseLog | null {
	if (log == null) return null;
	try {
		const rawSets = log.sets;
		const safeSets = Array.isArray(rawSets)
			? rawSets
					.filter((s): s is SetLog => s != null)
					.map((s) => ({
						setNumber: s?.setNumber ?? 0,
						weight: s?.weight ?? 0,
						reps: s?.reps ?? 0,
						completed: s?.completed ?? false,
						notes: s?.notes ?? undefined,
						rpe: s?.rpe,
					}))
			: [];
		const notes = getNotesSafe(log);
		return {
			...log,
			sets: safeSets.length > 0 ? safeSets : [],
			notes,
		};
	} catch {
		return null;
	}
}

interface WeightTrackerProps {
	exerciseName: string;
	exerciseId: string;
	defaultSets: number;
	defaultReps: string;
	onComplete: (log: ExerciseLog) => void;
	onSaveProgress?: (log: ExerciseLog) => void;
	existingLog?: ExerciseLog | null;
	isUnilateral?: boolean;
}

const DEFAULT_SET: SetLog = {
	setNumber: 1,
	weight: 0,
	reps: 0,
	completed: false,
};

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
	const safeLog = useMemo(
		() => normalizeExistingLog(existingLog),
		[existingLog],
	);

	const [sets, setSets] = useState<SetLog[]>(() => {
		try {
			if (safeLog?.sets && safeLog.sets.length > 0) {
				return safeLog.sets.map((set) => ({
					setNumber: set?.setNumber ?? 0,
					weight: set?.weight ?? 0,
					reps: set?.reps ?? 0,
					completed: set?.completed ?? false,
					notes: set?.notes ?? undefined,
					rpe: set?.rpe,
				}));
			}
		} catch {
			// fallthrough to default
		}
		return [DEFAULT_SET];
	});

	const [notes, setNotes] = useState(() => getNotesSafe(safeLog));

	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: queremos ressincronizar apenas quando o id do log mudar para não sobrescrever o estado local já editado
	useEffect(() => {
		// Só ressincroniza com o log existente quando o ID mudar
		// (abrir outro exercício / outro log). Isso evita sobrescrever
		// o estado local (como `completed`) em toda renderização.
		if (safeLog?.sets && safeLog.sets.length > 0) {
			const loadedSets = safeLog.sets.map((set) => ({
				setNumber: set?.setNumber ?? 0,
				weight: set?.weight ?? 0,
				reps: set?.reps ?? 0,
				completed: set?.completed ?? false,
				notes: set?.notes ?? undefined,
				rpe: set?.rpe,
			}));
			setSets(loadedSets);
			setNotes(getNotesSafe(safeLog));
		} else {
			setSets([DEFAULT_SET]);
			setNotes("");
		}
	}, [safeLog?.id]);

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

	const isCompleted = safeLog?.sets && safeLog.sets.length > 0;

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
											: "border-duo-border bg-duo-bg-card",
								)}
							>
								<div className="mb-3 flex items-center justify-between">
									<div>
										<span className="inline-flex items-center rounded-full bg-duo-blue/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-duo-blue">
											Série {set.setNumber}
										</span>
									</div>
									<div className="flex items-center gap-2">
										{sets.length > 1 && (
											<DuoButton
												type="button"
												variant="danger"
												size="icon-sm"
												onClick={() => handleRemoveSet(index)}
												title="Remover série"
												className="p-0"
											>
												<X className="h-4 w-4" />
											</DuoButton>
										)}
									</div>
								</div>

								{!set.completed ? (
									<div className="grid grid-cols-2 gap-3">
										<div>
											<label
												htmlFor={`set-${index}-weight`}
												className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-duo-gray-dark"
											>
												Peso (kg)
											</label>
											<input
												id={`set-${index}-weight`}
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
											<label
												htmlFor={`set-${index}-reps`}
												className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-duo-gray-dark"
											>
												Reps
											</label>
											<input
												id={`set-${index}-reps`}
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
											<motion.div
												initial={{ opacity: 0, scale: 0.9 }}
												animate={{ opacity: 1, scale: 1 }}
												className="col-span-2"
											>
												<DuoButton
													type="button"
													onClick={() => handleSetComplete(index)}
													variant="primary"
													className="flex w-full items-center justify-center gap-2 text-[13px]"
												>
													<Check className="h-5 w-5" />
													COMPLETAR SÉRIE
												</DuoButton>
											</motion.div>
										)}
										{isEmpty && (
											<div className="col-span-2 text-center text-xs text-duo-gray-dark">
												Preencha peso e repetições para completar
											</div>
										)}
									</div>
								) : (
									<div className="flex items-center justify-between text-sm text-duo-text">
										<span>
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
				<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
					<DuoButton
						type="button"
						variant="outline"
						className="flex w-full items-center justify-center gap-2 rounded-2xl border-dashed bg-duo-bg-card py-4 font-bold text-duo-gray-dark hover:bg-duo-blue/5"
						onClick={handleAddSet}
					>
						<Plus className="h-5 w-5" />
						ADICIONAR SÉRIE
					</DuoButton>
				</motion.div>
			</div>

			{/* Volume total (sempre visível se houver séries válidas) */}
			{totalVolume > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
				>
					<DuoStatCard.Simple
						icon={TrendingUp}
						iconColor="var(--duo-warning)"
						value={`${totalVolume.toFixed(0)} kg`}
						label="Volume total do exercício"
						badge="Soma de todas as séries válidas"
						className="w-full"
					/>
				</motion.div>
			)}

			{/* Notas */}
			<div>
				<label
					htmlFor="weight-tracker-notes"
					className="mb-2 block text-sm font-bold text-duo-gray-dark"
				>
					Notas (opcional)
				</label>
				<textarea
					id="weight-tracker-notes"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					placeholder="Como foi o treino? Sentiu alguma dificuldade?"
					className="w-full rounded-xl border-2 border-duo-border px-4 py-3 text-duo-text focus:border-duo-blue focus:outline-none"
					rows={3}
				/>
			</div>

			{/* Botão finalizar - aparece se houver pelo menos uma série válida */}
			{hasValidSets && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
				>
					<DuoButton
						type="button"
						onClick={handleFinish}
						variant="primary"
						className="w-full text-lg"
					>
						FINALIZAR EXERCÍCIO
					</DuoButton>
				</motion.div>
			)}
		</div>
	);
}
