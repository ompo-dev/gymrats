"use client";

import { ArrowLeft, Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DuoButton, DuoCard } from "@/components/duo";
import { useStudent } from "@/hooks/use-student";
import { apiClient } from "@/lib/api/client";
import { muscleDatabase } from "@/lib/educational-data";
import type { MuscleInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";
import { EndOfListState } from "./end-of-list-state";
import { LoadingMoreState } from "./loading-more-state";
import { LoadingState } from "./loading-state";
import { ModalContainer } from "./modal-container";
import { ModalContent } from "./modal-content";
import { ModalHeader } from "./modal-header";
import { SearchInput } from "./search-input";

interface ExerciseSearchProps {
	workoutId: string;
	onClose: () => void;
}

interface ExerciseResult {
	id: string;
	name: string;
	primaryMuscles?: string[];
	secondaryMuscles?: string[];
	difficulty?: string;
	equipment?: string[];
}

const ITEMS_PER_PAGE = 40;

const muscleCategories = [
	{ value: "", label: "Todos", icon: "💪" },
	{ value: "peito", label: "Peito", icon: "🫁" },
	{ value: "costas", label: "Costas", icon: "🏋️" },
	{ value: "pernas", label: "Pernas", icon: "🦵" },
	{ value: "ombros", label: "Ombros", icon: "💪" },
	{ value: "bracos", label: "Braços", icon: "💪" },
	{ value: "core", label: "Core", icon: "🔥" },
	{ value: "gluteos", label: "Glúteos", icon: "🍑" },
	{ value: "cardio", label: "Cardio", icon: "❤️" },
	{ value: "funcional", label: "Funcional", icon: "⚡" },
] as const;

const muscleGroupLabels: Record<string, string> = {
	peito: "Peito",
	costas: "Costas",
	pernas: "Pernas",
	ombros: "Ombros",
	bracos: "Braços",
	core: "Core",
	gluteos: "Glúteos",
	cardio: "Cardio",
	funcional: "Funcional",
};

const difficultyColors = {
	iniciante: {
		bg: "bg-duo-green/20",
		text: "text-duo-green",
	},
	intermediario: {
		bg: "bg-duo-orange/20",
		text: "text-duo-orange",
	},
	avancado: {
		bg: "bg-duo-red/20",
		text: "text-duo-red",
	},
} as const;

const getDifficultyClasses = (difficulty?: string) => {
	if (!difficulty) return difficultyColors.intermediario;
	const normalized = difficulty.toLowerCase() as keyof typeof difficultyColors;
	const colors = difficultyColors[normalized] || difficultyColors.intermediario;
	return `${colors.bg} ${colors.text}`;
};

export function ExerciseSearch({ workoutId, onClose }: ExerciseSearchProps) {
	const profile = useStudent("profile");
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("");
	const [selectedMuscle, setSelectedMuscle] = useState<string>("");
	const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
	const [exercises, setExercises] = useState<ExerciseResult[]>([]);
	// Cache de todos os exercícios já carregados (para resolver bug de navegação entre categorias)
	const exercisesCacheRef = useRef<Map<string, ExerciseResult>>(new Map());
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [currentPage, setCurrentPage] = useState(0);
	const [viewMode, setViewMode] = useState<"main" | "subcategory">("main");
	const [selectedGroup, setSelectedGroup] = useState<string>("");
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	// Obter músculos de um grupo específico
	const musclesByGroup = useMemo(() => {
		if (!selectedGroup) return [];
		return muscleDatabase.filter((muscle) => muscle.group === selectedGroup);
	}, [selectedGroup]);

	// Debounce da busca
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(query);
		}, 500);
		return () => clearTimeout(timer);
	}, [query]);

	const isFetchingRef = useRef(false);
	const fetchIdRef = useRef(0);

	// Resetar paginação quando query, categoria ou músculo mudar
	useEffect(() => {
		setCurrentPage(0);
		setExercises([]);
		setHasMore(true);
	}, [debouncedQuery, selectedCategory, selectedMuscle]);

	// Quando uma categoria principal é selecionada, mudar para view de subcategorias
	const handleCategorySelect = (categoryValue: string) => {
		if (categoryValue === "") {
			// "Todos" - voltar para view principal
			setViewMode("main");
			setSelectedGroup("");
			setSelectedCategory("");
			setSelectedMuscle("");
		} else {
			// Categoria específica - mostrar subcategorias
			setViewMode("subcategory");
			setSelectedGroup(categoryValue);
			setSelectedCategory(categoryValue);
			setSelectedMuscle(""); // Resetar músculo selecionado
		}
	};

	// Quando um músculo específico é selecionado
	const handleMuscleSelect = (muscleName: string) => {
		setSelectedMuscle(muscleName);
		setSelectedCategory(""); // Limpar categoria para usar músculo específico
	};

	// Voltar para categorias principais
	const handleBackToMain = () => {
		setViewMode("main");
		setSelectedGroup("");
		setSelectedCategory("");
		setSelectedMuscle("");
	};

	// Buscar exercícios (sem isLoading/isLoadingMore nas deps para evitar loop)
	const fetchExercises = useCallback(
		async (page: number, reset: boolean = false) => {
			if (page > 0 && isFetchingRef.current) return;
			isFetchingRef.current = true;
			const id = ++fetchIdRef.current;

			try {
				if (page === 0) {
					setIsLoading(true);
				} else {
					setIsLoadingMore(true);
				}

				const params = new URLSearchParams();
				if (debouncedQuery.trim()) {
					params.append("q", debouncedQuery.trim());
				}
				// Se um músculo específico foi selecionado, usar ele; senão usar a categoria
				if (selectedMuscle) {
					params.append("muscle", selectedMuscle);
				} else if (selectedCategory) {
					params.append("muscle", selectedCategory);
				}
				params.append("limit", ITEMS_PER_PAGE.toString());
				params.append("offset", (page * ITEMS_PER_PAGE).toString());

				const response = await apiClient.get<{
					exercises: ExerciseResult[];
					total: number;
				}>(`/api/exercises/search?${params.toString()}`);

				const newExercises = response.data.exercises || [];
				if (id !== fetchIdRef.current) return;

				newExercises.forEach((ex: ExerciseResult) => {
					exercisesCacheRef.current.set(ex.id, ex);
				});

				if (reset || page === 0) {
					setExercises(newExercises);
				} else {
					setExercises((prev) => [...prev, ...newExercises]);
				}

				setHasMore(newExercises.length === ITEMS_PER_PAGE);
			} catch (error) {
				if (id !== fetchIdRef.current) return;
				console.error("[ExerciseSearch] Erro ao buscar exercícios:", error);
				if (page === 0) {
					setExercises([]);
				}
				setHasMore(false);
			} finally {
				if (id === fetchIdRef.current) isFetchingRef.current = false;
				setIsLoading(false);
				setIsLoadingMore(false);
			}
		},
		[debouncedQuery, selectedCategory, selectedMuscle],
	);

	// Carregar primeira página quando query, categoria ou músculo mudar
	useEffect(() => {
		fetchExercises(0, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetchExercises]);

	// Carregar próxima página quando currentPage mudar (exceto página 0)
	useEffect(() => {
		if (currentPage > 0) {
			fetchExercises(currentPage, false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, fetchExercises]);

	// Infinite scroll - detectar quando está perto do final
	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container || !hasMore || isLoadingMore || isLoading) return;

		let isFetching = false;

		const handleScroll = () => {
			if (isFetching) return;

			const { scrollTop, scrollHeight, clientHeight } = container;
			// Carregar mais quando estiver a 200px do final
			if (scrollHeight - scrollTop - clientHeight < 200) {
				isFetching = true;
				setCurrentPage((prev) => prev + 1);
				// O useEffect acima vai chamar fetchExercises quando currentPage mudar
				setTimeout(() => {
					isFetching = false;
				}, 1000); // Prevenir múltiplas chamadas rápidas
			}
		};

		container.addEventListener("scroll", handleScroll);
		return () => container.removeEventListener("scroll", handleScroll);
	}, [hasMore, isLoadingMore, isLoading]);

	const _defaultSets = profile?.preferredSets || 3;
	const _defaultReps = (() => {
		const pref = profile?.preferredRepRange as any;
		if (pref === "forca") return "4-6";
		if (pref === "resistencia") return "15-20";
		return "8-12";
	})();
	const _defaultRest = (() => {
		const rt = profile?.restTime as any;
		if (rt === "curto") return 45;
		if (rt === "longo") return 120;
		return 90;
	})();

	const actions = useStudent("actions");

	const handleExerciseSelection = (exerciseId: string) => {
		setSelectedExerciseIds((prev) => {
			if (prev.includes(exerciseId)) {
				return prev.filter((id) => id !== exerciseId);
			} else {
				return [...prev, exerciseId];
			}
		});
	};

	const handleAddExercises = () => {
		if (selectedExerciseIds.length === 0) return;

		// Usar cache para encontrar exercícios, não apenas o array atual
		const exercisesToAdd = selectedExerciseIds
			.map((exerciseId) => {
				// Primeiro tenta no array atual, depois no cache
				const exercise =
					exercises.find((e) => e.id === exerciseId) ||
					exercisesCacheRef.current.get(exerciseId);
				if (!exercise) return null;
				return exercise;
			})
			.filter(Boolean) as ExerciseResult[];

		if (exercisesToAdd.length === 0) return;

		// Iniciar adição de todos os exercícios (SEM await - optimistic update acontece primeiro!)
		// As actions fazem optimistic update IMEDIATAMENTE, então UI já está atualizada
		// Enviar APENAS educationalId - backend busca todas as informações e calcula sets/reps/rest
		const addPromises = exercisesToAdd.map((ex) =>
			actions
				.addWorkoutExercise(workoutId, {
					educationalId: ex.id, // Apenas o ID - backend busca tudo
				})
				.catch((e: any) => {
					// Tratar erros em background (não bloqueia UI)
					console.error("Erro ao adicionar exercício:", e);
					const errorMessage =
						e?.message ||
						e?.response?.data?.message ||
						"Falha ao adicionar exercício";

					// Mensagem específica para workout ainda não criado
					if (errorMessage.includes("ainda está sendo criado")) {
						toast.error(
							"O dia de treino ainda está sendo criado. Aguarde alguns segundos e tente novamente.",
							{ duration: 5000 },
						);
					} else {
						toast.error(errorMessage);
					}
				}),
		);

		// Toast apenas para feedback - UI já atualizou via optimistic update
		toast.success(
			`${exercisesToAdd.length} exercício${
				exercisesToAdd.length > 1 ? "s" : ""
			} adicionado${exercisesToAdd.length > 1 ? "s" : ""}`,
		);

		// Limpar seleções
		setSelectedExerciseIds([]);

		// Fechar modal IMEDIATAMENTE - optimistic update já atualizou a UI!
		// As requisições continuam em background
		onClose();

		// Processar promises em background (não bloqueia)
		Promise.all(addPromises).catch(() => {
			// Erros já foram tratados individualmente acima
		});
	};

	const hasSelectedExercises = selectedExerciseIds.length > 0;

	return (
		<ModalContainer isOpen={true} onClose={onClose}>
			<ModalHeader title="Buscar Exercícios" onClose={onClose}>
				{/* Navegação hierárquica de categorias */}
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15, duration: 0.3 }}
					className="mb-4"
				>
					{viewMode === "main" ? (
						<>
							<label className="mb-2 block text-sm font-bold text-[var(--duo-fg-muted)]">
								Categoria:
							</label>
							<div className="flex flex-wrap gap-2">
								{muscleCategories.map((category) => (
									<DuoButton
										key={category.value}
										type="button"
										variant="outline"
										onClick={() => handleCategorySelect(category.value)}
										className={cn(
											"flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs min-h-0",
											selectedCategory === category.value
												? "border-duo-green bg-duo-green/10 text-duo-green shadow-[0_2px_0_#58A700]"
												: "border-duo-border bg-duo-bg-card text-duo-text hover:border-duo-green/50",
										)}
									>
										<span>{category.icon}</span>
										<span>{category.label}</span>
									</DuoButton>
								))}
							</div>
						</>
					) : (
						<>
							<div className="mb-3 flex items-center gap-2">
								<DuoButton
									type="button"
									variant="outline"
									size="icon-sm"
									onClick={handleBackToMain}
									className="h-8 w-8 rounded-full"
								>
									<ArrowLeft className="h-4 w-4" />
								</DuoButton>
								<label className="text-sm font-bold text-[var(--duo-fg-muted)]">
									{muscleGroupLabels[selectedGroup]} - Selecione o músculo:
								</label>
							</div>
							<div className="flex flex-wrap gap-2">
								{musclesByGroup.map((muscle: MuscleInfo) => (
									<DuoButton
										key={muscle.id}
										type="button"
										variant="outline"
										onClick={() => handleMuscleSelect(muscle.name)}
										className={cn(
											"flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs min-h-0",
											selectedMuscle === muscle.name
												? "border-duo-green bg-duo-green/10 text-duo-green shadow-[0_2px_0_#58A700]"
												: "border-duo-border bg-duo-bg-card text-duo-text hover:border-duo-green/50",
										)}
									>
										<span>{muscle.name}</span>
									</DuoButton>
								))}
							</div>
						</>
					)}
				</motion.div>

				{/* Campo de busca */}
				<SearchInput
					value={query}
					onChange={setQuery}
					placeholder="Buscar exercícios..."
				/>
			</ModalHeader>

			<ModalContent ref={scrollContainerRef}>
				{isLoading ? (
					<LoadingState message="Carregando exercícios..." />
				) : exercises.length === 0 ? (
					<EmptyState
						message={
							debouncedQuery || selectedCategory || selectedMuscle
								? `Nenhum exercício encontrado${
										debouncedQuery ? ` para "${debouncedQuery}"` : ""
									}${
										selectedMuscle
											? ` no músculo "${selectedMuscle}"`
											: selectedCategory
												? ` na categoria "${
														muscleGroupLabels[selectedCategory] ||
														selectedCategory
													}"`
												: ""
									}`
								: "Digite algo para buscar ou selecione uma categoria"
						}
					/>
				) : (
					<>
						<div className="space-y-3">
							{exercises.map((ex, idx) => {
								const isSelected = selectedExerciseIds.includes(ex.id);
								return (
									<motion.div
										key={`${ex.id}-${idx}`}
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: idx * 0.05, duration: 0.2 }}
									>
										<DuoCard
											variant={isSelected ? "highlighted" : "interactive"}
											padding="md"
											className="cursor-pointer"
											onClick={() => handleExerciseSelection(ex.id)}
										>
											<div className="flex items-start justify-between gap-3">
												<div className="flex-1 min-w-0">
													{/* Nome e Dificuldade */}
													<div className="mb-2 flex items-center gap-2 flex-wrap">
														<span className="font-bold text-[var(--duo-fg)] text-base">
															{ex.name}
														</span>
														{ex.difficulty && (
															<span
																className={cn(
																	"rounded-full px-2 py-0.5 text-xs font-bold capitalize shrink-0",
																	getDifficultyClasses(ex.difficulty),
																)}
															>
																{ex.difficulty}
															</span>
														)}
													</div>

													{/* Músculos Primários */}
													{ex.primaryMuscles && ex.primaryMuscles.length > 0 && (
														<div className="mb-2 flex flex-wrap gap-1.5">
															{ex.primaryMuscles.map((muscle, i) => (
																<span
																	key={i}
																	className="rounded-full bg-[var(--duo-primary)]/20 px-2 py-0.5 text-xs font-bold capitalize text-[var(--duo-primary)]"
																>
																	{muscleGroupLabels[muscle.toLowerCase()] ||
																		muscle}
																</span>
															))}
														</div>
													)}

													{/* Músculos Secundários */}
													{ex.secondaryMuscles &&
														ex.secondaryMuscles.length > 0 && (
															<div className="mb-2 flex flex-wrap gap-1.5">
																{ex.secondaryMuscles
																	.slice(0, 3)
																	.map((muscle, i) => (
																		<span
																			key={i}
																			className="rounded-full bg-[var(--duo-secondary)]/20 px-2 py-0.5 text-xs font-bold capitalize text-[var(--duo-secondary)]"
																		>
																			{muscleGroupLabels[muscle.toLowerCase()] ||
																				muscle}
																		</span>
																	))}
																{ex.secondaryMuscles.length > 3 && (
																	<span className="rounded-full bg-[var(--duo-border)] px-2 py-0.5 text-xs font-bold text-[var(--duo-fg-muted)]">
																		+{ex.secondaryMuscles.length - 3}
																	</span>
																)}
															</div>
														)}

													{/* Equipamento */}
													{ex.equipment && ex.equipment.length > 0 && (
														<div className="flex flex-wrap gap-1.5">
															{ex.equipment.slice(0, 2).map((eq, i) => (
																<span
																	key={i}
																	className="rounded-lg bg-[var(--duo-border)] px-2 py-0.5 text-xs font-bold text-[var(--duo-fg-muted)]"
																>
																	{eq}
																</span>
															))}
															{ex.equipment.length > 2 && (
																<span className="rounded-lg bg-[var(--duo-border)] px-2 py-0.5 text-xs font-bold text-[var(--duo-fg-muted)]">
																	+{ex.equipment.length - 2}
																</span>
															)}
														</div>
													)}
												</div>

												{/* Checkbox de seleção */}
												{isSelected && (
													<motion.div
														initial={{ scale: 0 }}
														animate={{ scale: 1 }}
														transition={{ type: "spring", stiffness: 200 }}
														className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--duo-primary)] text-white"
													>
														✓
													</motion.div>
												)}
											</div>
										</DuoCard>
									</motion.div>
								);
							})}
						</div>
						{isLoadingMore && (
							<LoadingMoreState message="Carregando mais exercícios..." />
						)}
						{!hasMore && exercises.length > 0 && (
							<EndOfListState total={exercises.length} itemName="exercícios" />
						)}
					</>
				)}
			</ModalContent>

			<AnimatePresence>
				{hasSelectedExercises && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 20 }}
						transition={{ duration: 0.3 }}
						className="border-t-2 border-[var(--duo-border)] p-6 space-y-4"
					>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.1 }}
						>
							<label className="mb-3 block text-sm font-bold text-[var(--duo-fg-muted)]">
								Exercícios Selecionados ({selectedExerciseIds.length} exercício
								{selectedExerciseIds.length !== 1 ? "s" : ""})
							</label>
							<div
								className="space-y-2 overflow-y-auto scrollbar-hide"
								style={{ maxHeight: "200px" }}
							>
								<AnimatePresence>
									{selectedExerciseIds.map((exerciseId, index) => {
										const exercise =
											exercises.find((e) => e.id === exerciseId) ||
											exercisesCacheRef.current.get(exerciseId);
										if (!exercise) return null;
										return (
											<motion.div
												key={exerciseId}
												initial={{ opacity: 0, y: -10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, scale: 0.9, height: 0 }}
												transition={{ delay: index * 0.05, duration: 0.2 }}
											>
												<DuoCard
													variant="outlined"
													padding="sm"
													className="flex items-start justify-between gap-3"
												>
													<div className="flex-1 min-w-0">
														<div className="mb-1.5 flex items-center gap-2 flex-wrap">
															<div className="text-sm font-bold text-[var(--duo-fg)]">
																{exercise.name}
															</div>
															{exercise.difficulty && (
																<span
																	className={cn(
																		"rounded-full px-2 py-0.5 text-xs font-bold capitalize shrink-0",
																		getDifficultyClasses(exercise.difficulty),
																	)}
																>
																	{exercise.difficulty}
																</span>
															)}
														</div>
														{exercise.primaryMuscles &&
															exercise.primaryMuscles.length > 0 && (
																<div className="flex flex-wrap gap-1">
																	{exercise.primaryMuscles
																		.slice(0, 2)
																		.map((muscle, i) => (
																			<span
																				key={i}
																				className="rounded-full bg-[var(--duo-primary)]/20 px-1.5 py-0.5 text-xs font-bold capitalize text-[var(--duo-primary)]"
																			>
																				{muscleGroupLabels[
																					muscle.toLowerCase()
																				] || muscle}
																			</span>
																		))}
																	{exercise.primaryMuscles.length > 2 && (
																		<span className="rounded-full bg-[var(--duo-border)] px-1.5 py-0.5 text-xs font-bold text-[var(--duo-fg-muted)]">
																			+{exercise.primaryMuscles.length - 2}
																		</span>
																	)}
																</div>
															)}
													</div>
													<DuoButton
														variant="outline"
														size="icon-sm"
														onClick={(e) => {
															e.stopPropagation();
															handleExerciseSelection(exerciseId);
														}}
														className="h-8 w-8 shrink-0 rounded-full"
													>
														<Minus className="h-4 w-4" />
													</DuoButton>
												</DuoCard>
											</motion.div>
										);
									})}
								</AnimatePresence>
							</div>
						</motion.div>
						<DuoButton onClick={handleAddExercises} variant="primary" className="w-full">
							<Plus className="h-5 w-5" />
							ADICIONAR {selectedExerciseIds.length} EXERCÍCIO
							{selectedExerciseIds.length !== 1 ? "S" : ""}
						</DuoButton>
					</motion.div>
				)}
			</AnimatePresence>
		</ModalContainer>
	);
}
