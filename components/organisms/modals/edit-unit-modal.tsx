"use client";

import {
	Dumbbell,
	Edit2,
	GripVertical,
	Plus,
	Save,
	Sparkles,
	Trash2,
} from "lucide-react";
import { motion, Reorder } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DuoButton } from "@/components/duo";
import { DuoCard } from "@/components/duo";
import { useModalStateWithParam } from "@/hooks/use-modal-state";
import { useStudent } from "@/hooks/use-student";
import type { WorkoutExercise, WorkoutSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { ExerciseSearch } from "./exercise-search";
import { ModalContainer } from "./modal-container";
import { ModalContent } from "./modal-content";
import { ModalHeader } from "./modal-header";
import { WorkoutChat } from "./workout-chat";

const muscleCategories = [
	{ value: "", label: "Nenhum", icon: "⚪" },
	{ value: "peito", label: "Peito", icon: "🫁" },
	{ value: "costas", label: "Costas", icon: "🏋️" },
	{ value: "pernas", label: "Pernas", icon: "🦵" },
	{ value: "ombros", label: "Ombros", icon: "💪" },
	{ value: "bracos", label: "Braços", icon: "💪" },
	{ value: "core", label: "Core", icon: "🔥" },
	{ value: "gluteos", label: "Glúteos", icon: "🍑" },
	{ value: "cardio", label: "Cardio", icon: "❤️" },
	{ value: "funcional", label: "Funcional", icon: "⚡" },
	{ value: "full_body", label: "Corpo Inteiro", icon: "💪" },
] as const;

export function EditUnitModal() {
	const _router = useRouter();
	const {
		isOpen,
		close,
		paramValue: unitId,
	} = useModalStateWithParam("editUnit", "unitId");
	const actions = useStudent("actions");

	const [showExerciseSearch, setShowExerciseSearch] = useState(false);

	// View state
	const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
	const [showWorkoutChat, setShowWorkoutChat] = useState(false);

	// Form states (Unit) - apenas para inputs controlados
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [isEditingUnitInputs, setIsEditingUnitInputs] = useState(false);

	// Estado controlado para título do workout
	const [workoutTitle, setWorkoutTitle] = useState("");
	const [workoutMuscleGroup, setWorkoutMuscleGroup] = useState<string>("");

	// Estados para reordenação usando Reorder
	const [workoutItems, setWorkoutItems] = useState<WorkoutSession[]>([]);
	const [exerciseItems, setExerciseItems] = useState<WorkoutExercise[]>([]);

	// IMPORTANTE: Seletores específicos do Zustand que detectam mudanças IMEDIATAMENTE
	// Quando addWorkoutExercise faz optimistic update no store, estes seletores detectam INSTANTANEAMENTE
	// porque o Zustand re-renderiza quando state.data.units muda (nova referência de array)

	// Seletor para unit completo - retorna null se não encontrado
	const unit = useStudentUnifiedStore((state) => {
		return state.data.units.find((u) => u.id === unitId) || null;
	});

	// Ordenar workouts por ordem antes de usar
	// IMPORTANTE: Usar IDs para comparação estável e evitar loops infinitos
	const _workoutsIds = useMemo(() => {
		if (!unit?.workouts || unit.workouts.length === 0) return "";
		return unit.workouts.map((w) => w.id).join(",");
	}, [unit?.workouts]);

	const sortedWorkouts = useMemo(() => {
		if (!unit?.workouts || unit.workouts.length === 0) return [];
		// Criar novo array para garantir reatividade do useMemo
		return [...unit.workouts].sort((a, b) => (a.order || 0) - (b.order || 0));
	}, [unit?.workouts]);

	// Sincronizar workoutItems com sortedWorkouts
	// IMPORTANTE: Verificar se realmente mudou para evitar loops infinitos
	// CRÍTICO: Não incluir workoutItems nas dependências para evitar loops
	useEffect(() => {
		// Verificar se realmente mudou (comparando IDs e tamanho para evitar loops)
		const currentIds = workoutItems.map((w) => w.id).join(",");
		const newIds = sortedWorkouts.map((w) => w.id).join(",");

		// Só atualizar se IDs mudaram OU se o tamanho mudou (novo workout adicionado)
		if (
			currentIds !== newIds ||
			workoutItems.length !== sortedWorkouts.length
		) {
			setWorkoutItems(sortedWorkouts);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sortedWorkouts, workoutItems.length, workoutItems.map]); // IMPORTANTE: Não incluir workoutItems para evitar loops

	// IMPORTANTE: Seletor específico para exercises do workout ativo
	// CRÍTICO: Usar useMemo para garantir referência estável e evitar loops infinitos
	// Quando addWorkoutExercise faz optimistic update:
	// 1. Store atualiza state.data.units com NOVO array (nova referência)
	// 2. Zustand detecta mudança em state.data.units (shallow equality)
	// 3. Este seletor é executado novamente
	// 4. Retorna NOVO array de exercises (criado no optimistic update)
	// 5. useMemo detecta mudança e recalcula, componente re-renderiza IMEDIATAMENTE
	const exercisesRaw = useStudentUnifiedStore((state) => {
		if (!editingWorkoutId || !unitId) return null;
		const foundUnit = state.data.units.find((u) => u.id === unitId);
		if (!foundUnit) return null;
		const foundWorkout = foundUnit.workouts.find(
			(w) => w.id === editingWorkoutId,
		);
		if (!foundWorkout) return null;
		// IMPORTANTE: Retornar null quando não encontrado, não [] (evita nova referência a cada render)
		return foundWorkout.exercises || null;
	});

	// Usar useMemo para garantir referência estável quando exercises não existe
	// Isso evita loops infinitos causados por novas referências a cada render
	const exercises = useMemo(() => {
		return exercisesRaw || [];
	}, [exercisesRaw]);

	// Calcular activeWorkout baseado nos sortedWorkouts (para outros dados como título, etc)
	const activeWorkout = useMemo(() => {
		return sortedWorkouts.find(
			(w: WorkoutSession) => w.id === editingWorkoutId,
		);
	}, [sortedWorkouts, editingWorkoutId]);

	// Ordenar exercícios por ordem - IMPORTANTE: usar exercises do store diretamente!
	// CRÍTICO: Usar IDs para comparação estável e evitar loops infinitos
	// Quando addWorkoutExercise faz optimistic update:
	// 1. Store atualiza state.data.units com NOVO array (nova referência)
	// 2. Seletor `exercises` detecta mudança e retorna NOVO array de exercises
	// 3. useMemo detecta mudança em `exercisesIds` e recalcula sortedExercises
	// 4. useEffect detecta mudança em sortedExercises e atualiza exerciseItems
	// 5. Componente re-renderiza IMEDIATAMENTE com novos exercícios!
	const _exercisesIds = useMemo(() => {
		if (!exercises || exercises.length === 0) return "";
		return exercises.map((e) => e.id).join(",");
	}, [exercises]);

	const sortedExercises = useMemo(() => {
		if (!exercises || exercises.length === 0) return [];
		// Criar novo array para garantir reatividade do useMemo
		return [...exercises].sort((a, b) => (a.order || 0) - (b.order || 0));
	}, [exercises]);

	// Sincronizar exerciseItems com sortedExercises - IMPORTANTE: verificar mudanças reais!
	// Isso garante que optimistic updates apareçam instantaneamente na UI
	// O Reorder precisa de estado controlado, mas deve sempre refletir sortedExercises
	// CRÍTICO: Verificar se realmente mudou (comparando IDs) para evitar loops infinitos
	// IMPORTANTE: Não incluir exerciseItems nas dependências para evitar loops
	useEffect(() => {
		// Verificar se realmente mudou (comparando IDs e tamanho para evitar loops)
		const currentIds = exerciseItems.map((e) => e.id).join(",");
		const newIds = sortedExercises.map((e) => e.id).join(",");

		// Só atualizar se IDs mudaram OU se o tamanho mudou (novo exercício adicionado)
		if (
			currentIds !== newIds ||
			exerciseItems.length !== sortedExercises.length
		) {
			setExerciseItems(sortedExercises);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sortedExercises, exerciseItems.length, exerciseItems.map]); // IMPORTANTE: Não incluir exerciseItems para evitar loops

	// Calcular tempo estimado baseado nos exercícios
	// IMPORTANTE: Usar exercises diretamente do store para garantir reatividade imediata
	// Quando addWorkoutExercise faz optimistic update, exercises muda IMEDIATAMENTE
	const calculatedEstimatedTime = useMemo(() => {
		if (!exercises || exercises.length === 0) {
			return 0;
		}

		const TIME_PER_REP = 2; // segundos por repetição (média)

		const totalSeconds = exercises.reduce(
			(total: number, ex: WorkoutExercise) => {
				const sets = ex.sets || 0;
				if (sets === 0) return total;

				// Parse reps (pode ser "8-12" ou "12")
				const repsStr = ex.reps || "10";
				let avgReps = 10; // padrão

				// Verificar se é um range (ex: "8-12")
				const rangeMatch = repsStr.match(/(\d+)\s*-\s*(\d+)/);
				if (rangeMatch) {
					// Se for range, usar a média dos dois valores
					const min = parseInt(rangeMatch[1], 10);
					const max = parseInt(rangeMatch[2], 10);
					avgReps = Math.round((min + max) / 2);
				} else {
					// Se for um número único, usar esse valor
					const singleMatch = repsStr.match(/(\d+)/);
					if (singleMatch) {
						avgReps = parseInt(singleMatch[1], 10);
					}
				}

				// Tempo por série = média de repetições * tempo por repetição
				const timePerSet = avgReps * TIME_PER_REP;

				// Descanso entre séries (se são 4 séries, há 3 descansos)
				const restBetweenSets = ex.rest || 60; // segundos
				const numberOfRests = sets > 0 ? sets - 1 : 0;

				// Tempo total do exercício = (séries * tempo_por_serie) + (número_de_descansos * descanso)
				const exerciseTime =
					sets * timePerSet + numberOfRests * restBetweenSets;

				return total + exerciseTime;
			},
			0,
		);

		// Converter para minutos e arredondar para cima
		const totalMinutes = Math.ceil(totalSeconds / 60);

		// Adicionar 10 minutos para atividades preparatórias
		// (pegar anilhas, trocar pesos, séries preparatórias, aquecimento, válidas, até a falha, etc.)
		return totalMinutes + 10;
	}, [exercises]); // IMPORTANTE: Usar exercises diretamente do store para garantir reatividade imediata

	// Atualizar estimatedTime quando exercícios mudarem
	// IMPORTANTE: Usar ref para evitar loops infinitos - só atualizar uma vez por mudança real
	const lastCalculatedTimeRef = useRef<number>(0);

	// Função para atualizar workout - DEVE estar ANTES do useEffect que a usa
	const handleUpdateWorkout = useCallback(
		async (
			workoutId: string,
			data: {
				title?: string;
				muscleGroup?: string;
				estimatedTime?: number;
				order?: number;
			},
		) => {
			// Não precisa de try/catch com toast - optimistic update já atualiza UI instantaneamente!
			// Apenas chamar a action - o store gerencia tudo
			actions.updateWorkout(workoutId, data).catch((error) => {
				console.error(error);
				toast.error("Erro ao atualizar treino");
			});
		},
		[actions],
	);

	useEffect(() => {
		if (!activeWorkout || calculatedEstimatedTime <= 0) return;

		// Só atualiza se o valor realmente mudou (com margem de 1 minuto)
		const currentTime = activeWorkout.estimatedTime || 0;
		const hasSignificantChange =
			Math.abs(currentTime - calculatedEstimatedTime) >= 1;
		const hasChangedSinceLastUpdate =
			lastCalculatedTimeRef.current !== calculatedEstimatedTime;

		// CRÍTICO: Só atualizar se realmente mudou E não atualizamos este valor ainda
		if (hasSignificantChange && hasChangedSinceLastUpdate) {
			lastCalculatedTimeRef.current = calculatedEstimatedTime;
			handleUpdateWorkout(activeWorkout.id, {
				estimatedTime: calculatedEstimatedTime,
			});
		}
	}, [calculatedEstimatedTime, activeWorkout, handleUpdateWorkout]);

	// Sincronizar inputs apenas quando unit mudar (mas não durante edição)
	useEffect(() => {
		if (isOpen && unitId && unit) {
			// Só atualiza os inputs se o ID mudou ou se o título/descrição local está vazio (primeira carga)
			if (!isEditingUnitInputs && title === "" && description === "") {
				setTitle(unit.title ?? "");
				setDescription(unit.description ?? "");
			}
		} else {
			// Reset state when closed
			setEditingWorkoutId(null);
			setShowExerciseSearch(false);
			setTitle("");
			setDescription("");
			setWorkoutTitle("");
			setDeleteConfirmationId(null);
			setDeleteWorkoutConfirmationId(null);
			// Limpar estados de reordenação
			setWorkoutItems([]);
			setExerciseItems([]);
		}
	}, [isOpen, unitId, unit?.id, isEditingUnitInputs, title, unit, description]);

	// Sincronizar workoutTitle e muscleGroup quando activeWorkout mudar
	useEffect(() => {
		if (activeWorkout) {
			setWorkoutTitle(activeWorkout.title ?? "");
			setWorkoutMuscleGroup(activeWorkout.muscleGroup ?? "");
		} else {
			setWorkoutTitle("");
			setWorkoutMuscleGroup("");
		}
	}, [
		activeWorkout?.id,
		activeWorkout?.title,
		activeWorkout?.muscleGroup,
		activeWorkout,
	]);

	// --- Unit Actions ---

	const handleSaveUnit = async () => {
		if (!unitId) return;

		// Não precisa de setIsSaving - optimistic update já atualiza UI instantaneamente!
		try {
			await actions.updateUnit(unitId, {
				title,
				description,
			});
			// Toast apenas para feedback - UI já atualizou via optimistic update
			toast.success("Treino atualizado com sucesso!");
		} catch (error) {
			console.error(error);
			toast.error("Erro ao atualizar treino");
		}
	};

	const handleCreateWorkout = async () => {
		if (!unitId) return;

		// Não precisa de setIsSaving - optimistic update já atualiza UI instantaneamente!
		try {
			// createWorkout retorna o ID do workout criado (temporário ou real)
			const workoutId = await actions.createWorkout({
				unitId,
				title: "Novo Dia",
				description: "Descrição do treino",
				muscleGroup: "", // Vazio - será selecionado no modal depois
				difficulty: "iniciante",
				estimatedTime: 0, // Será calculado automaticamente baseado nos exercícios
				type: "strength",
			});

			// Abrir modal de edição imediatamente com o ID retornado
			// O ID pode ser temporário (se offline) ou real (se sincronizado)
			// O componente vai reagir automaticamente quando o ID for atualizado
			setEditingWorkoutId(workoutId);

			// Toast apenas para feedback - UI já atualizou via optimistic update
			toast.success("Novo dia de treino adicionado!");
		} catch (error) {
			console.error(error);
			toast.error("Erro ao criar treino");
		}
	};

	const _handleDeleteWorkout = async (workoutId: string) => {
		setDeleteWorkoutConfirmationId(workoutId);
	};

	const confirmDeleteWorkout = async () => {
		if (!deleteWorkoutConfirmationId) return;

		const workoutIdToDelete = deleteWorkoutConfirmationId;
		setDeleteWorkoutConfirmationId(null);

		// Se estava editando esse workout, voltar para a view de unit ANTES de deletar
		if (editingWorkoutId === workoutIdToDelete) {
			setEditingWorkoutId(null);
		}

		// Não precisa de setIsSaving - optimistic update já atualiza UI instantaneamente!
		try {
			await actions.deleteWorkout(workoutIdToDelete);
			// Toast apenas para feedback - UI já atualizou via optimistic update
			toast.success("Dia de treino removido!");
		} catch (error) {
			console.error(error);
			const message =
				(error as any)?.response?.data?.message || "Falha ao remover treino";
			toast.error(message);
		}
	};

	const cancelDeleteWorkout = () => {
		setDeleteWorkoutConfirmationId(null);
	};

	// Reordenar workouts usando Reorder
	const handleReorderWorkouts = (newOrder: WorkoutSession[]) => {
		setWorkoutItems(newOrder);
		// Atualizar ordem de todos os workouts no backend
		newOrder.forEach((workout, index) => {
			const currentOrder = workout.order ?? 0;
			if (currentOrder !== index) {
				handleUpdateWorkout(workout.id, { order: index });
			}
		});
	};

	// --- Exercise Actions ---

	const handleAddExercise = async () => {
		if (!editingWorkoutId) return;
		setShowExerciseSearch(true);
	};

	const handleUpdateExercise = async (
		exerciseId: string,
		data: Partial<WorkoutExercise>,
	) => {
		// Não precisa de try/catch com toast - optimistic update já atualiza UI instantaneamente!
		// Apenas chamar a action - o store gerencia tudo
		actions.updateWorkoutExercise(exerciseId, data).catch((error) => {
			console.error(error);
			toast.error("Erro ao salvar exercício");
		});
	};

	// Reordenar exercícios usando Reorder
	const handleReorderExercises = (newOrder: WorkoutExercise[]) => {
		setExerciseItems(newOrder);
		// Atualizar ordem de todos os exercícios no backend
		newOrder.forEach((exercise, index) => {
			const currentOrder = exercise.order ?? 0;
			if (currentOrder !== index) {
				handleUpdateExercise(exercise.id, { order: index });
			}
		});
	};

	const [deleteConfirmationId, setDeleteConfirmationId] = useState<
		string | null
	>(null);
	const [deleteWorkoutConfirmationId, setDeleteWorkoutConfirmationId] =
		useState<string | null>(null);

	const handleDeleteExercise = async (exerciseId: string) => {
		setDeleteConfirmationId(exerciseId);
	};

	const handleDeleteWorkoutClick = (workoutId: string) => {
		setDeleteWorkoutConfirmationId(workoutId);
	};

	const confirmDeleteExercise = async () => {
		if (!deleteConfirmationId) return;

		const exerciseIdToDelete = deleteConfirmationId;
		setDeleteConfirmationId(null);

		// Não precisa de setIsSaving - optimistic update já atualiza UI instantaneamente!
		try {
			await actions.deleteWorkoutExercise(exerciseIdToDelete);
			// Toast apenas para feedback - UI já atualizou via optimistic update
			toast.success("Exercício removido!");
		} catch (error: any) {
			console.error(error);
			// Tratamento de erro 500 genérico para mensagem amigável
			const errorMessage =
				error.response?.data?.message ||
				"Erro ao remover exercício. Tente novamente.";
			toast.error(errorMessage);
		}
	};

	const cancelDelete = () => {
		setDeleteConfirmationId(null);
	};

	if (!isOpen) return null;

	return (
		<>
			<ModalContainer isOpen={isOpen} onClose={close}>
				<ModalHeader
					title={
						editingWorkoutId
							? `Editar ${activeWorkout?.title}`
							: "Editar Planejamento"
					}
					onClose={close}
					onBack={
						editingWorkoutId
							? () => {
									setEditingWorkoutId(null);
									setShowExerciseSearch(false);
								}
							: undefined
					}
				/>

				<ModalContent maxHeight="none">
					{!editingWorkoutId ? (
						// --- UNIT VIEW ---
						<div className="space-y-8" style={{ minHeight: "400px" }}>
							{/* Unit Details */}
							<div className="space-y-4 bg-duo-bg-card p-6 rounded-2xl shadow-sm border border-duo-border">
								<div>
									<label className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider mb-2 block">
										Nome do Plano
									</label>
									<input
										type="text"
										value={title || ""}
										onChange={(e) => setTitle(e.target.value)}
										onFocus={() => setIsEditingUnitInputs(true)}
										onBlur={() => setIsEditingUnitInputs(false)}
										className="w-full px-4 py-3 rounded-xl bg-duo-bg-elevated border border-duo-border focus:outline-none focus:ring-2 focus:ring-duo-green/20 focus:border-duo-green transition-all font-bold text-lg"
										placeholder="Ex: Treino de Hipertrofia"
									/>
								</div>
								<div>
									<label className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider mb-2 block">
										Descrição
									</label>
									<textarea
										value={description || ""}
										onChange={(e) => setDescription(e.target.value)}
										onFocus={() => setIsEditingUnitInputs(true)}
										onBlur={() => setIsEditingUnitInputs(false)}
										className="w-full px-4 py-3 rounded-xl bg-duo-bg-elevated border border-duo-border focus:outline-none focus:ring-2 focus:ring-duo-green/20 focus:border-duo-green transition-all resize-none h-24"
										placeholder="Descreva o objetivo deste plano..."
									/>
								</div>
								<div className="flex justify-end pt-2">
									<DuoButton
										onClick={handleSaveUnit}
										className="bg-duo-green hover:bg-duo-green-dark text-white font-bold flex items-center gap-2"
										style={{
											opacity: 1,
											visibility: "visible",
											display: "flex",
										}}
									>
										<Save className="h-4 w-4" />
										Salvar Alterações
									</DuoButton>
								</div>
							</div>

							{/* Workouts List */}
							<div className="space-y-4">
								<div className="flex items-center justify-between px-1 mb-4">
									<h3 className="text-lg font-bold text-duo-text">
										Dias de Treino
									</h3>
									<div className="flex items-center gap-2">
										<DuoButton
											size="sm"
											variant="outline"
											onClick={() => setShowWorkoutChat(true)}
											className="border-2 border-duo-green font-bold hover:bg-duo-green/10 text-duo-green flex items-center gap-2 z-10 relative"
											style={{
												opacity: 1,
												visibility: "visible",
												display: "flex",
												pointerEvents: "auto",
												zIndex: 10,
											}}
										>
											<Sparkles className="h-4 w-4" />
											Chat IA
										</DuoButton>
										<DuoButton
											size="sm"
											variant="outline"
											onClick={handleCreateWorkout}
											className="border-2 font-bold hover:bg-duo-bg-elevated flex items-center gap-2 z-10 relative"
											style={{
												opacity: 1,
												visibility: "visible",
												display: "flex",
												pointerEvents: "auto",
												zIndex: 10,
											}}
										>
											<Plus className="h-4 w-4" />
											Adicionar Dia
										</DuoButton>
									</div>
								</div>

								{workoutItems.length > 0 ? (
									<Reorder.Group
										axis="y"
										values={workoutItems}
										onReorder={handleReorderWorkouts}
										className="space-y-3"
									>
										{workoutItems.map(
											(workout: WorkoutSession, index: number) => (
												<Reorder.Item
													key={workout.id}
													value={workout}
													className="cursor-grab active:cursor-grabbing"
												>
													<DuoCard
														variant="highlighted"
														className="group hover:border-duo-green/50 transition-colors bg-duo-bg-card"
													>
														<div className="flex items-center gap-4">
															{/* Handle de arrastar */}
															<div className="flex-none cursor-grab active:cursor-grabbing text-duo-fg-muted hover:text-duo-green transition-colors">
																<GripVertical className="h-5 w-5" />
															</div>
															<div className="flex-none flex items-center justify-center w-10 h-10 rounded-2xl bg-duo-green/10 text-duo-green font-bold text-lg">
																{index + 1}
															</div>
															<div
																className="flex-1 min-w-0 cursor-pointer"
																onClick={() => setEditingWorkoutId(workout.id)}
															>
																<h4 className="font-bold text-duo-text truncate text-lg">
																	{workout.title}
																</h4>
																<p className="text-sm text-duo-fg-muted truncate">
																	{workout.exercises.length} exercícios •{" "}
																	{workout.muscleGroup}
																</p>
															</div>
															<div
																className="flex items-center gap-2 z-10 relative"
																style={{
																	opacity: 1,
																	visibility: "visible",
																	display: "flex",
																	pointerEvents: "auto",
																	zIndex: 10,
																}}
															>
																<DuoButton
																	variant="ghost"
																	size="icon"
																	className="text-duo-fg-muted hover:text-duo-green hover:bg-duo-green/10"
																	onClick={(e) => {
																		e.stopPropagation();
																		setEditingWorkoutId(workout.id);
																	}}
																	title="Editar dia de treino"
																	style={{
																		opacity: 1,
																		visibility: "visible",
																		display: "flex",
																		pointerEvents: "auto",
																	}}
																>
																	<Edit2 className="h-5 w-5" />
																</DuoButton>
																<DuoButton
																	variant="ghost"
																	size="icon"
																	className="text-duo-fg-muted hover:text-duo-danger hover:bg-duo-danger/10"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleDeleteWorkoutClick(workout.id);
																	}}
																	title="Remover dia de treino"
																	style={{
																		opacity: 1,
																		visibility: "visible",
																		display: "flex",
																		pointerEvents: "auto",
																	}}
																>
																	<Trash2 className="h-5 w-5" />
																</DuoButton>
															</div>
														</div>
													</DuoCard>
												</Reorder.Item>
											),
										)}
									</Reorder.Group>
								) : (
									<div className="text-center py-12 text-duo-fg-muted bg-duo-bg-card rounded-2xl border-2 border-dashed border-duo-border">
										<div className="w-12 h-12 rounded-full bg-duo-bg-elevated flex items-center justify-center mx-auto mb-3">
											<Dumbbell className="h-6 w-6 text-duo-fg-muted" />
										</div>
										<p className="font-bold">Nenhum dia de treino adicionado</p>
										<p className="text-sm mt-1">
											Clique em "Adicionar Dia" para começar
										</p>
									</div>
								)}
							</div>
						</div>
					) : (
						// --- WORKOUT VIEW ---
						<div className="space-y-6">
							{/* Header do Workout */}
							<div className="bg-duo-bg-card p-6 rounded-2xl shadow-sm border border-duo-border space-y-4">
								<div>
									<label className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider mb-2 block">
										Título do Dia
									</label>
									<input
										type="text"
										value={workoutTitle}
										onChange={(e) => setWorkoutTitle(e.target.value)}
										onBlur={(e) => {
											if (
												activeWorkout &&
												e.target.value !== activeWorkout.title &&
												e.target.value.trim() !== ""
											) {
												handleUpdateWorkout(activeWorkout.id, {
													title: e.target.value,
												});
											} else if (e.target.value.trim() === "") {
												// Reverter se ficou vazio
												setWorkoutTitle(activeWorkout?.title ?? "");
											}
										}}
										className="w-full px-4 py-2 rounded-xl bg-duo-bg-elevated border border-duo-border focus:outline-none focus:ring-2 focus:ring-duo-green/20 focus:border-duo-green transition-all font-bold"
									/>
								</div>
								<div>
									<label className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider mb-2 block">
										Grupo Muscular
									</label>
									<div className="flex flex-wrap gap-2">
										{muscleCategories.map((category) => (
											<motion.button
												key={category.value}
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												onClick={() => {
													setWorkoutMuscleGroup(category.value);
													if (activeWorkout) {
														handleUpdateWorkout(activeWorkout.id, {
															muscleGroup: category.value,
														});
													}
												}}
												className={cn(
													"flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all",
													workoutMuscleGroup === category.value
														? "border-duo-green bg-duo-green/10 text-duo-green shadow-[0_2px_0_#58A700]"
														: "border-duo-border bg-duo-bg-card text-duo-text hover:border-duo-green/50",
												)}
											>
												<span>{category.icon}</span>
												<span>{category.label}</span>
											</motion.button>
										))}
									</div>
								</div>
								{calculatedEstimatedTime > 0 && (
									<div className="rounded-xl bg-duo-green/10 border border-duo-green/20 p-3">
										<div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
											Tempo Estimado
										</div>
										<div className="text-lg font-bold text-duo-green">
											{calculatedEstimatedTime} min
										</div>
										<div className="text-xs text-duo-fg-muted mt-1">
											Calculado automaticamente baseado nos exercícios
										</div>
									</div>
								)}
							</div>

							<div className="flex items-center justify-between px-1 mb-4">
								<h3 className="text-lg font-bold text-duo-text">Exercícios</h3>
								<DuoButton
									size="sm"
									onClick={handleAddExercise}
									className="bg-duo-green hover:bg-duo-green-dark text-white font-bold flex items-center gap-2 z-10 relative"
									style={{
										opacity: 1,
										visibility: "visible",
										display: "flex",
										pointerEvents: "auto",
										zIndex: 10,
									}}
								>
									<Plus className="h-4 w-4" />
									Adicionar Exercício
								</DuoButton>
							</div>

							{exerciseItems.length > 0 ? (
								<Reorder.Group
									axis="y"
									values={exerciseItems}
									onReorder={handleReorderExercises}
									className="space-y-3"
								>
									{exerciseItems.map(
										(exercise: WorkoutExercise, index: number) => (
											<Reorder.Item
												key={exercise.id}
												value={exercise}
												className="cursor-grab active:cursor-grabbing"
											>
												<DuoCard
													variant="highlighted"
													size="md"
													className="group hover:border-duo-green/50 transition-all bg-duo-bg-card"
												>
													{/* Primeira div: Número, Nome e Botão de excluir */}
													<div className="flex items-center gap-4">
														{/* Handle de arrastar */}
														<div className="flex-none cursor-grab active:cursor-grabbing text-duo-fg-muted hover:text-duo-green transition-colors">
															<GripVertical className="h-5 w-5" />
														</div>
														{/* Número do exercício */}
														<div className="flex-none flex items-center justify-center w-10 h-10 rounded-2xl bg-duo-green/10 text-duo-green font-bold text-lg shrink-0">
															{index + 1}
														</div>

														{/* Nome do exercício */}
														<div className="flex-1 min-w-0">
															<input
																type="text"
																defaultValue={exercise.name ?? ""}
																onBlur={(e) =>
																	handleUpdateExercise(exercise.id, {
																		name: e.target.value,
																	})
																}
																className="w-full px-4 py-2.5 rounded-xl bg-duo-bg-elevated border border-duo-border hover:bg-duo-bg-card hover:border-duo-border focus:bg-duo-bg-card focus:border-duo-green focus:outline-none focus:ring-2 focus:ring-duo-green/20 font-bold text-base transition-all"
																placeholder="Nome do exercício"
															/>
														</div>

														{/* Botão de deletar */}
														<div
															className="flex-none z-10 relative"
															style={{
																opacity: 1,
																visibility: "visible",
																display: "flex",
																pointerEvents: "auto",
																zIndex: 10,
															}}
														>
															<DuoButton
																variant="ghost"
																size="icon"
																className="text-duo-fg-muted hover:text-duo-danger hover:bg-duo-danger/10 transition-colors"
																onClick={() =>
																	handleDeleteExercise(exercise.id)
																}
																title="Remover exercício"
																style={{
																	opacity: 1,
																	visibility: "visible",
																	display: "flex",
																	pointerEvents: "auto",
																}}
															>
																<Trash2 className="h-5 w-5" />
															</DuoButton>
														</div>
													</div>

													{/* Segunda div: Séries, Repetições e Descanso */}
													<div className="grid grid-cols-3 gap-3 mt-4">
														<div className="flex flex-col gap-1.5 bg-duo-bg-elevated rounded-xl p-3 border border-duo-border hover:bg-duo-bg-elevated transition-colors items-center justify-center">
															<label className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider text-center w-full">
																Séries
															</label>
															<input
																type="number"
																defaultValue={exercise.sets ?? 0}
																onBlur={(e) =>
																	handleUpdateExercise(exercise.id, {
																		sets: parseInt(e.target.value, 10) || 0,
																	})
																}
																className="w-full bg-transparent font-bold text-duo-text text-center text-lg focus:outline-none border-b-2 border-transparent focus:border-duo-green transition-colors"
																min="0"
															/>
														</div>
														<div className="flex flex-col gap-1.5 bg-duo-bg-elevated rounded-xl p-3 border border-duo-border hover:bg-duo-bg-elevated transition-colors items-center justify-center">
															<label className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider text-center w-full">
																Repetições
															</label>
															<input
																type="text"
																defaultValue={exercise.reps ?? ""}
																onBlur={(e) =>
																	handleUpdateExercise(exercise.id, {
																		reps: e.target.value,
																	})
																}
																className="w-full bg-transparent font-bold text-duo-text text-center text-lg focus:outline-none border-b-2 border-transparent focus:border-duo-green transition-colors"
																placeholder="8-12"
															/>
														</div>
														<div className="flex flex-col gap-1.5 bg-duo-bg-elevated rounded-xl p-3 border border-duo-border hover:bg-duo-bg-elevated transition-colors items-center justify-center">
															<label className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider text-center w-full">
																Descanso
															</label>
															<div className="flex items-center justify-center gap-1">
																<input
																	type="number"
																	defaultValue={exercise.rest ?? 0}
																	onBlur={(e) =>
																		handleUpdateExercise(exercise.id, {
																			rest: parseInt(e.target.value, 10) || 0,
																		})
																	}
																	className="w-full bg-transparent font-bold text-duo-text text-center text-lg focus:outline-none border-b-2 border-transparent focus:border-duo-green transition-colors"
																	min="0"
																/>
																<span className="text-xs font-bold text-duo-fg-muted">
																	s
																</span>
															</div>
														</div>
													</div>
												</DuoCard>
											</Reorder.Item>
										),
									)}
								</Reorder.Group>
							) : (
								<div className="text-center py-12 text-duo-fg-muted">
									<p>Nenhum exercício neste dia.</p>
								</div>
							)}
						</div>
					)}
				</ModalContent>
			</ModalContainer>

			{showExerciseSearch && editingWorkoutId && isOpen && (
				<ExerciseSearch
					workoutId={editingWorkoutId}
					onClose={() => setShowExerciseSearch(false)}
				/>
			)}

			{showWorkoutChat && isOpen && unitId && (
				<WorkoutChat
					unitId={unitId}
					workouts={sortedWorkouts}
					onClose={() => setShowWorkoutChat(false)}
				/>
			)}

			<DeleteConfirmationModal
				isOpen={!!deleteConfirmationId}
				onConfirm={confirmDeleteExercise}
				onCancel={cancelDelete}
				title="Remover Exercício?"
				message="Tem certeza que deseja remover este exercício do treino?"
			/>

			<DeleteConfirmationModal
				isOpen={!!deleteWorkoutConfirmationId}
				onConfirm={confirmDeleteWorkout}
				onCancel={cancelDeleteWorkout}
				title="Remover Dia de Treino?"
				message="Tem certeza que deseja remover este dia de treino? Todos os exercícios serão removidos também."
			/>
		</>
	);
}
