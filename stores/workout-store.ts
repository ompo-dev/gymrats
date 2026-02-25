import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/lib/api/client";
import type { ExerciseLog, WorkoutSession } from "@/lib/types";

interface WorkoutProgress {
	workoutId: string;
	currentExerciseIndex: number;
	exerciseLogs: ExerciseLog[];
	skippedExercises: string[]; // IDs dos exercícios pulados
	skippedExerciseIndices: number[]; // Índices pulados (para stepper, não depende de match por id)
	selectedAlternatives: Record<string, string>; // exerciseId -> alternativeId
	xpEarned: number; // XP total ganho no workout
	totalVolume: number; // Volume total em kg
	completionPercentage: number; // Porcentagem de conclusão
	startTime: Date;
	lastUpdated: Date;
	cardioPreference?: "none" | "before" | "after"; // Preferência de cardio
	cardioDuration?: number; // Duração do cardio em minutos (5, 10, 15, 20)
	selectedCardioType?: string; // Tipo de cardio selecionado (para manter consistente)
}

interface WorkoutState {
	activeWorkout: WorkoutProgress | null;
	workoutProgress: Record<string, WorkoutProgress>;
	completedWorkouts: Set<string>; // IDs dos workouts completados
	openWorkoutId: string | null; // ID do workout aberto no modal
	setActiveWorkout: (workout: WorkoutSession | null) => void;
	setCurrentExerciseIndex: (index: number) => void;
	addExerciseLog: (log: ExerciseLog) => void;
	updateExerciseLog: (
		exerciseId: string,
		updates: Partial<ExerciseLog>,
	) => void;
	saveWorkoutProgress: (workoutId: string) => Promise<void>;
	loadWorkoutProgress: (workoutId: string) => WorkoutProgress | null;
	clearWorkoutProgress: (workoutId: string) => void;
	completeWorkout: (workoutId: string) => Promise<void>;
	isWorkoutCompleted: (workoutId: string) => boolean;
	isWorkoutInProgress: (workoutId: string) => boolean;
	getWorkoutProgress: (workoutId: string) => number; // Retorna % de progresso (0-100)
	openWorkout: (workoutId: string | null) => void; // Abrir/fechar modal
	skipExercise: (exerciseId: string, exerciseIndex: number) => void; // Marcar exercício como pulado
	calculateWorkoutStats: () => void; // Calcular estatísticas do workout (XP, volume, %)
	selectAlternative: (exerciseId: string, alternativeId?: string) => void; // Selecionar alternativa
	setCardioPreference: (
		preference: "none" | "before" | "after",
		duration?: number,
	) => void; // Definir preferência de cardio
}

export const useWorkoutStore = create<WorkoutState>()(
	persist(
		(set, get) => ({
			activeWorkout: null,
			workoutProgress: {},
			completedWorkouts: new Set<string>(),
			openWorkoutId: null,
			setActiveWorkout: (workout) =>
				set((state) => {
					// Avoid redundant updates if the workout is already the same
					if (!workout && !state.activeWorkout) return state;
					if (workout && state.activeWorkout?.workoutId === workout.id) return state;

					return {
						activeWorkout: workout
							? {
									workoutId: workout.id,
									currentExerciseIndex: 0,
									exerciseLogs: [],
									skippedExercises: [],
									skippedExerciseIndices: [],
									selectedAlternatives: {},
									xpEarned: 0,
									totalVolume: 0,
									completionPercentage: 0,
									startTime: new Date(),
									lastUpdated: new Date(),
									cardioPreference: undefined,
									cardioDuration: undefined,
									selectedCardioType: undefined,
								}
							: null,
					};
				}),
			setCurrentExerciseIndex: (index) =>
				set((state) => {
					if (!state.activeWorkout) return state;
					return {
						activeWorkout: {
							...state.activeWorkout,
							currentExerciseIndex: index,
							lastUpdated: new Date(),
						},
					};
				}),
			addExerciseLog: (log) =>
				set((state) => {
					if (!state.activeWorkout) return state;
					const newLogs = [...state.activeWorkout.exerciseLogs, log];
					console.log("📝 addExerciseLog:", {
						exerciseName: log.exerciseName,
						logId: log.id,
						totalLogsBefore: state.activeWorkout.exerciseLogs.length,
						totalLogsAfter: newLogs.length,
						allExercises: newLogs.map((l) => l.exerciseName),
					});
					// Calcular volume do exercício (apenas séries válidas com peso > 0 e reps > 0)
					const exerciseVolume = log.sets
						.filter((set) => set.weight > 0 && set.reps > 0)
						.reduce((acc, set) => acc + set.weight * set.reps, 0);
					// Calcular XP do exercício (assumindo XP igual por exercício)
					// Isso será ajustado quando calcularmos as estatísticas
					return {
						activeWorkout: {
							...state.activeWorkout,
							exerciseLogs: newLogs,
							totalVolume: state.activeWorkout.totalVolume + exerciseVolume,
							lastUpdated: new Date(),
						},
					};
				}),
			updateExerciseLog: (exerciseId, updates) =>
				set((state) => {
					if (!state.activeWorkout) return state;

					// Atualizar o log específico
					const updatedLogs = state.activeWorkout.exerciseLogs.map((log) =>
						log.exerciseId === exerciseId ? { ...log, ...updates } : log,
					);

					// Recalcular volume total apenas das séries válidas (peso > 0 e reps > 0)
					const totalVolume = updatedLogs.reduce(
						(acc, log) =>
							acc +
							(log.sets || [])
								.filter((set) => set.weight > 0 && set.reps > 0)
								.reduce((setAcc, set) => setAcc + set.weight * set.reps, 0),
						0,
					);

					return {
						activeWorkout: {
							...state.activeWorkout,
							exerciseLogs: updatedLogs,
							totalVolume,
							lastUpdated: new Date(),
						},
					};
				}),
			saveWorkoutProgress: async (workoutId) => {
				const state = get();
				if (!state.activeWorkout || state.activeWorkout.workoutId !== workoutId)
					return;

				// Salva sempre, mesmo sem logs (para rastrear índice atual, exercícios pulados, etc)
				// Garantir que todas as propriedades estejam presentes
				const progressToSave: WorkoutProgress = {
					workoutId: state.activeWorkout.workoutId,
					currentExerciseIndex: state.activeWorkout.currentExerciseIndex,
					exerciseLogs: state.activeWorkout.exerciseLogs || [],
					skippedExercises: state.activeWorkout.skippedExercises || [],
					skippedExerciseIndices:
						state.activeWorkout.skippedExerciseIndices || [],
					selectedAlternatives: state.activeWorkout.selectedAlternatives || {},
					xpEarned: state.activeWorkout.xpEarned || 0,
					totalVolume: state.activeWorkout.totalVolume || 0,
					completionPercentage: state.activeWorkout.completionPercentage || 0,
					startTime: state.activeWorkout.startTime,
					lastUpdated: new Date(),
					cardioPreference: state.activeWorkout.cardioPreference,
					cardioDuration: state.activeWorkout.cardioDuration,
					selectedCardioType: state.activeWorkout.selectedCardioType,
				};

				// Salvar no localStorage (otimistic update)
				set({
					workoutProgress: {
						...state.workoutProgress,
						[workoutId]: progressToSave,
					},
				});

				// Sincronizar com backend em background
				try {
					// Transformar exerciseLogs para o formato esperado pelo schema
					const transformedExerciseLogs = progressToSave.exerciseLogs.map(
						(log) => ({
							exerciseId: log.exerciseId,
							exerciseName: log.exerciseName,
							sets:
								log.sets?.map((set) => ({
									weight: set.weight ?? null,
									reps: set.reps ?? null,
									completed: set.completed ?? false,
									notes: set.notes ?? null,
								})) ?? [],
							notes: log.notes ?? null,
							formCheckScore: log.formCheckScore ?? null,
							// Converter enum de difficulty para o formato esperado pelo schema
							difficulty: log.difficulty
								? (log.difficulty.replace("-", "_").replace("ideal", "medio") as
										| "muito_facil"
										| "facil"
										| "medio"
										| "dificil"
										| "muito_dificil")
								: null,
						}),
					);

					await apiClient.post(`/api/workouts/${workoutId}/progress`, {
						currentExerciseIndex: progressToSave.currentExerciseIndex,
						exerciseLogs: transformedExerciseLogs,
						skippedExercises: progressToSave.skippedExercises,
						selectedAlternatives: progressToSave.selectedAlternatives,
						xpEarned: progressToSave.xpEarned,
						totalVolume: progressToSave.totalVolume,
						completionPercentage: progressToSave.completionPercentage,
						// Converter Date para ISO string se necessário
						startTime:
							progressToSave.startTime instanceof Date
								? progressToSave.startTime.toISOString()
								: typeof progressToSave.startTime === "string"
									? progressToSave.startTime
									: progressToSave.startTime
										? new Date(progressToSave.startTime).toISOString()
										: undefined,
						cardioPreference: progressToSave.cardioPreference,
						cardioDuration: progressToSave.cardioDuration,
						selectedCardioType: progressToSave.selectedCardioType,
					});
				} catch (error: unknown) {
					const err = error as {
						response?: {
							status?: number;
							data?: { code?: string; error?: string };
						};
						message?: string;
					};
					const status = err?.response?.status;
					const code = err?.response?.data?.code;

					// Se a migration não foi aplicada, apenas logar e continuar
					if (code === "MIGRATION_REQUIRED") {
						console.log(
							"⚠️ Tabela workout_progress não existe. Execute: node scripts/migration/apply-workout-progress-migration.js",
						);
					} else if (status === 500) {
						// Erro 500 - logar como warning, não como error (pode ser temporário)
						console.warn(
							"⚠️ Erro 500 ao salvar progresso do workout. Dados salvos localmente.",
							err?.response?.data?.error || err?.message,
						);
					} else if (status === 404) {
						// Rota não encontrada - pode ser que ainda não esteja implementada
						console.warn(
							"⚠️ Rota de progresso não encontrada (404). Dados salvos localmente.",
						);
					} else if (status && status >= 400) {
						// Outros erros HTTP - logar como warning
						console.warn(
							`⚠️ Erro HTTP ${status} ao salvar progresso. Dados salvos localmente.`,
							err?.response?.data?.error || err?.message,
						);
					} else {
						// Erros de rede ou outros - logar como error
						console.error("Erro ao sincronizar progresso com backend:", error);
					}
					// Não reverter mudanças locais - manter otimistic update
				}
			},
			loadWorkoutProgress: (workoutId) => {
				// Usar apenas localStorage (Zustand persist) - dados já estão no store
				// Não fazer GET - os dados já foram carregados no loadAll do student-unified-store
				const state = get();
				return state.workoutProgress[workoutId] || null;
			},
			clearWorkoutProgress: (workoutId) =>
				set((state) => {
					const newProgress = { ...state.workoutProgress };
					delete newProgress[workoutId];
					return { workoutProgress: newProgress };
				}),
			completeWorkout: async (workoutId) => {
				const state = get();
				// Marcar como completo mas manter o progresso para permitir reabrir
				const newCompleted = new Set(state.completedWorkouts);
				newCompleted.add(workoutId);

				set({
					activeWorkout: null,
					// NÃO remover do workoutProgress - permite reabrir e fazer novamente
					completedWorkouts: newCompleted,
				});

				// Limpar progresso parcial do backend (já foi salvo como completo)
				// O endpoint /complete já faz isso, mas garantimos aqui também
				// Fazer de forma não-bloqueante para evitar timeout
				apiClient
					.delete(`/api/workouts/${workoutId}/progress`, {
						timeout: 5000, // Timeout menor para operação de limpeza
					})
					.catch((error: unknown) => {
						const err = error as {
							response?: { status?: number; data?: { code?: string } };
							code?: string;
							message?: string;
						};
						const status = err.response?.status;
						const code = err.response?.data?.code;
						const isTimeout =
							err.code === "ECONNABORTED" || err.message?.includes("timeout");

						if (status !== 404 && code !== "MIGRATION_REQUIRED" && !isTimeout) {
							console.error("Erro ao limpar progresso parcial:", error);
						}
					});
			},
			isWorkoutCompleted: (workoutId) => {
				const state = get();
				return state.completedWorkouts.has(workoutId);
			},
			isWorkoutInProgress: (workoutId) => {
				const state = get();
				const progress = state.workoutProgress[workoutId];
				if (!progress) return false;
				// Considera em progresso se houver logs OU exercícios pulados
				const hasLogs = progress.exerciseLogs.length > 0;
				const hasSkipped =
					progress.skippedExercises && progress.skippedExercises.length > 0;
				return hasLogs || hasSkipped;
			},
			getWorkoutProgress: (workoutId) => {
				const state = get();
				const progress = state.workoutProgress[workoutId];
				if (!progress) return 0;
				// Retorna o número total de exercícios vistos (completados + pulados)
				const completedCount = progress.exerciseLogs.length || 0;
				const skippedCount = progress.skippedExercises?.length || 0;
				return completedCount + skippedCount;
			},
			openWorkout: (workoutId) => set({ openWorkoutId: workoutId }),
			skipExercise: (exerciseId, exerciseIndex) =>
				set((state) => {
					if (!state.activeWorkout) return state;
					const skipped = [...state.activeWorkout.skippedExercises];
					if (!skipped.includes(exerciseId)) {
						skipped.push(exerciseId);
					}
					const skippedIndices = [
						...(state.activeWorkout.skippedExerciseIndices ?? []),
					];
					if (!skippedIndices.includes(exerciseIndex)) {
						skippedIndices.push(exerciseIndex);
					}
					return {
						activeWorkout: {
							...state.activeWorkout,
							skippedExercises: skipped,
							skippedExerciseIndices: skippedIndices,
							lastUpdated: new Date(),
						},
					};
				}),
			calculateWorkoutStats: () =>
				set((state) => {
					if (!state.activeWorkout) return state;
					const { exerciseLogs, skippedExercises } = state.activeWorkout;

					// Calcular volume total apenas de séries válidas (peso > 0 e reps > 0)
					const totalVolume = exerciseLogs.reduce(
						(acc, log) =>
							acc +
							log.sets
								.filter((set) => set.weight > 0 && set.reps > 0)
								.reduce((setAcc, set) => setAcc + set.weight * set.reps, 0),
						0,
					);

					// Calcular XP (assumindo que cada exercício completo dá XP igual)
					// Isso pode ser ajustado depois com base no workout.xpReward
					const completedCount = exerciseLogs.length;
					const skippedCount = skippedExercises.length;
					const _totalExercises = completedCount + skippedCount;

					// Porcentagem de conclusão baseada em exercícios processados
					// Isso será calculado no componente com base no workout.exercises.length
					const completionPercentage = 0; // Será calculado no componente

					return {
						activeWorkout: {
							...state.activeWorkout,
							totalVolume,
							xpEarned: state.activeWorkout.xpEarned, // Será calculado no componente
							completionPercentage,
							lastUpdated: new Date(),
						},
					};
				}),
			selectAlternative: (exerciseId, alternativeId) =>
				set((state) => {
					if (!state.activeWorkout) return state;
					const newAlternatives = {
						...state.activeWorkout.selectedAlternatives,
					};
					if (alternativeId) {
						newAlternatives[exerciseId] = alternativeId;
					} else {
						delete newAlternatives[exerciseId];
					}
					return {
						activeWorkout: {
							...state.activeWorkout,
							selectedAlternatives: newAlternatives,
							lastUpdated: new Date(),
						},
					};
				}),
			setCardioPreference: (preference, duration) =>
				set((state) => {
					if (!state.activeWorkout) return state;

					// Se já tem um cardio selecionado, manter. Senão, gerar novo
					const cardioTypes = [
						"corrida",
						"bicicleta",
						"eliptico",
						"pular-corda",
					];
					const selectedCardio =
						state.activeWorkout.selectedCardioType ||
						cardioTypes[Math.floor(Math.random() * cardioTypes.length)];

					return {
						activeWorkout: {
							...state.activeWorkout,
							cardioPreference: preference,
							cardioDuration: duration,
							selectedCardioType: selectedCardio,
							lastUpdated: new Date(),
						},
					};
				}),
		}),
		{
			name: "workout-storage",
			partialize: (state) => ({
				...state,
				completedWorkouts: Array.from(state.completedWorkouts),
			}),
			merge: (persistedState: unknown, currentState) => {
				const persisted = persistedState as Record<string, unknown> & {
					completedWorkouts?: string[];
				};
				return {
					...currentState,
					...(typeof persisted === "object" && persisted !== null
						? persisted
						: {}),
					completedWorkouts: persisted?.completedWorkouts
						? new Set(persisted.completedWorkouts)
						: new Set<string>(),
				};
			},
		},
	),
);
