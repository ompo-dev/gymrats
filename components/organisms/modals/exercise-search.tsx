"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/atoms/buttons/button";
import { cn } from "@/lib/utils";
import { useStudent } from "@/hooks/use-student";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { muscleDatabase } from "@/lib/educational-data";
import type { MuscleInfo } from "@/lib/types";
import { ModalContainer } from "./modal-container";
import { ModalHeader } from "./modal-header";
import { ModalContent } from "./modal-content";
import { SearchInput } from "./search-input";
import { LoadingState } from "./loading-state";
import { EmptyState } from "./empty-state";
import { LoadingMoreState } from "./loading-more-state";
import { EndOfListState } from "./end-of-list-state";

// Guardas globais para evitar re-fetch em remount com mesmos filtros
let __lastInitKey = "";
let __lastInitTs = 0;
let __lastReqKey = "";
let __lastReqTs = 0;

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

  // Controla inicializações por combinação de filtros para evitar chamadas duplicadas
  const initializedKeyRef = useRef<string>("");

  const isFetchingRef = useRef(false);
  const lastRequestKeyRef = useRef<string>("");
  const lastRequestTsRef = useRef<number>(0);

  const fetchExercises = useCallback(
    async (page: number, reset: boolean = false) => {
      // Prevenir múltiplas chamadas simultâneas
      if (isLoading || isLoadingMore) return;

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

        if (reset || page === 0) {
          setExercises(newExercises);
        } else {
          setExercises((prev) => [...prev, ...newExercises]);
        }

        // Se retornou menos que o limite, não há mais páginas
        setHasMore(newExercises.length === ITEMS_PER_PAGE);
      } catch (error) {
        console.error("[ExerciseSearch] Erro ao buscar exercícios:", error);
        if (page === 0) {
          setExercises([]);
        }
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [debouncedQuery, selectedCategory, selectedMuscle, isLoading, isLoadingMore]
  );

  // Carregar primeira página quando query, categoria ou músculo mudar
  useEffect(() => {
    fetchExercises(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, selectedCategory, selectedMuscle]);

  // Carregar próxima página quando currentPage mudar (exceto página 0)
  useEffect(() => {
    if (currentPage > 0) {
      fetchExercises(currentPage, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

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

  const defaultSets = profile?.preferredSets || 3;
  const defaultReps = (() => {
    const pref = profile?.preferredRepRange as any;
    if (pref === "forca") return "4-6";
    if (pref === "resistencia") return "15-20";
    return "8-12";
  })();
  const defaultRest = (() => {
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

  const handleAddExercises = async () => {
    if (selectedExerciseIds.length === 0) return;

    const exercisesToAdd = selectedExerciseIds
      .map((exerciseId) => {
        const exercise = exercises.find((e) => e.id === exerciseId);
        if (!exercise) return null;
        return exercise;
      })
      .filter(Boolean) as ExerciseResult[];

    if (exercisesToAdd.length === 0) return;

    try {
      // Adicionar todos os exercícios selecionados
      for (const ex of exercisesToAdd) {
        await actions.addWorkoutExercise(workoutId, {
          name: ex.name,
          sets: defaultSets,
          reps: defaultReps,
          rest: defaultRest,
          educationalId: ex.id,
        });
      }

      // Toast apenas para feedback - UI já atualizou via optimistic update
      toast.success(
        `${exercisesToAdd.length} exercício${
          exercisesToAdd.length > 1 ? "s" : ""
        } adicionado${exercisesToAdd.length > 1 ? "s" : ""}`
      );

      // Limpar seleções
      setSelectedExerciseIds([]);
    } catch (e: any) {
      console.error("Erro ao adicionar exercícios:", e);
      const errorMessage =
        e?.message ||
        e?.response?.data?.message ||
        "Falha ao adicionar exercícios";

      // Mensagem específica para workout ainda não criado
      if (errorMessage.includes("ainda está sendo criado")) {
        toast.error(
          "O dia de treino ainda está sendo criado. Aguarde alguns segundos e tente novamente.",
          { duration: 5000 }
        );
      } else {
        toast.error(errorMessage);
      }
    }
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
              <label className="mb-2 block text-sm font-bold text-gray-600">
                Categoria:
              </label>
              <div className="flex flex-wrap gap-2">
                {muscleCategories.map((category) => (
                  <motion.button
                    key={category.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCategorySelect(category.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all",
                      selectedCategory === category.value
                        ? "border-duo-green bg-duo-green/10 text-duo-green shadow-[0_2px_0_#58A700]"
                        : "border-gray-300 bg-white text-gray-700 hover:border-duo-green/50"
                    )}
                  >
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                  </motion.button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleBackToMain}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white text-gray-700 transition-all hover:bg-gray-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                </motion.button>
                <label className="text-sm font-bold text-gray-600">
                  {muscleGroupLabels[selectedGroup]} - Selecione o músculo:
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {musclesByGroup.map((muscle: MuscleInfo) => (
                  <motion.button
                    key={muscle.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleMuscleSelect(muscle.name)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all",
                      selectedMuscle === muscle.name
                        ? "border-duo-green bg-duo-green/10 text-duo-green shadow-[0_2px_0_#58A700]"
                        : "border-gray-300 bg-white text-gray-700 hover:border-duo-green/50"
                    )}
                  >
                    <span>{muscle.name}</span>
                  </motion.button>
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
                    className={cn(
                      "rounded-xl border-2 p-4 transition-all cursor-pointer",
                      isSelected
                        ? "border-duo-green bg-duo-green/10 shadow-[0_2px_0_#58A700]"
                        : "border-gray-200 bg-white hover:border-duo-green/50 hover:bg-gray-50"
                    )}
                    onClick={() => handleExerciseSelection(ex.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Nome e Dificuldade */}
                        <div className="mb-2 flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 text-base">
                            {ex.name}
                          </span>
                          {ex.difficulty && (
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-bold capitalize shrink-0",
                                getDifficultyClasses(ex.difficulty)
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
                                className="rounded-full bg-duo-green/20 px-2 py-0.5 text-xs font-bold capitalize text-duo-green"
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
                                    className="rounded-full bg-duo-blue/20 px-2 py-0.5 text-xs font-bold capitalize text-duo-blue"
                                  >
                                    {muscleGroupLabels[muscle.toLowerCase()] ||
                                      muscle}
                                  </span>
                                ))}
                              {ex.secondaryMuscles.length > 3 && (
                                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600">
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
                                className="rounded-lg bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-700"
                              >
                                {eq}
                              </span>
                            ))}
                            {ex.equipment.length > 2 && (
                              <span className="rounded-lg bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600">
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
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-duo-green text-white"
                        >
                          ✓
                        </motion.div>
                      )}
                    </div>
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
            className="border-t-2 border-gray-300 p-6 space-y-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <label className="mb-3 block text-sm font-bold text-gray-600">
                Exercícios Selecionados ({selectedExerciseIds.length} exercício
                {selectedExerciseIds.length !== 1 ? "s" : ""})
              </label>
              <div
                className="space-y-2 overflow-y-auto scrollbar-hide"
                style={{ maxHeight: "200px" }}
              >
                <AnimatePresence>
                  {selectedExerciseIds.map((exerciseId, index) => {
                    const exercise = exercises.find((e) => e.id === exerciseId);
                    if (!exercise) return null;
                    return (
                      <motion.div
                        key={exerciseId}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, height: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                        className="flex items-start justify-between gap-3 rounded-xl border-2 border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                            <div className="text-sm font-bold text-gray-900">
                              {exercise.name}
                            </div>
                            {exercise.difficulty && (
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-xs font-bold capitalize shrink-0",
                                  getDifficultyClasses(exercise.difficulty)
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
                                      className="rounded-full bg-duo-green/20 px-1.5 py-0.5 text-xs font-bold capitalize text-duo-green"
                                    >
                                      {muscleGroupLabels[
                                        muscle.toLowerCase()
                                      ] || muscle}
                                    </span>
                                  ))}
                                {exercise.primaryMuscles.length > 2 && (
                                  <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-bold text-gray-600">
                                    +{exercise.primaryMuscles.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExerciseSelection(exerciseId);
                          }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 bg-white text-gray-700 transition-all hover:bg-gray-100 active:scale-90"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
            <Button onClick={handleAddExercises} className="w-full">
              <Plus className="h-5 w-5" />
              ADICIONAR {selectedExerciseIds.length} EXERCÍCIO
              {selectedExerciseIds.length !== 1 ? "S" : ""}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContainer>
  );
}
