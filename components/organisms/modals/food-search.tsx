"use client";

import { Loader2, Minus, Plus, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DuoButton, DuoCard } from "@/components/duo";
import { DuoInput } from "@/components/duo/molecules/duo-input";
import { useAbility } from "@/hooks/use-ability";
import { Features } from "@/lib/access-control/features";
import { apiClient } from "@/lib/api/client";
import type { FoodItem, Meal } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FoodSearchChat } from "./food-search-chat";

interface FoodSearchProps {
  onAddFood: (
    foods: Array<{ food: FoodItem; servings: number }>,
    mealIds: string[],
  ) => void;
  onClose: () => void;
  selectedMealId?: string | null;
  meals?: Meal[];
  onSelectMeal?: (mealId: string) => void;
  onAddMeal?: (
    mealsData: Array<{
      name: string;
      type: Meal["type"];
      time?: string;
    }>,
  ) => void;
}

const mealIcons: Record<string, string> = {
  breakfast: "🍳",
  lunch: "🍽️",
  dinner: "🌙",
  snack: "🍎",
  "afternoon-snack": "☕",
  "pre-workout": "💪",
  "post-workout": "🏋️",
};

const mealTimes: Record<string, string> = {
  breakfast: "Café da Manhã",
  lunch: "Almoço",
  dinner: "Jantar",
  snack: "Lanche",
  "afternoon-snack": "Café da Tarde",
  "pre-workout": "Pré Treino",
  "post-workout": "Pós Treino",
};

const categories = [
  { value: "", label: "Todas", icon: "🍽️" },
  { value: "protein", label: "Proteínas", icon: "🥩" },
  { value: "carbs", label: "Carboidratos", icon: "🍞" },
  { value: "vegetables", label: "Vegetais", icon: "🥬" },
  { value: "fruits", label: "Frutas", icon: "🍎" },
  { value: "fats", label: "Gorduras", icon: "🥑" },
  { value: "dairy", label: "Laticínios", icon: "🥛" },
  { value: "snacks", label: "Snacks", icon: "🍪" },
] as const;

const ITEMS_PER_PAGE = 40;

function FoodSearchSimple({
  onAddFood,
  onClose,
  selectedMealId,
  meals = [],
  onSelectMeal,
  onAddMeal,
}: FoodSearchProps) {
  // Verificar se é premium/trial
  const { can } = useAbility();
  const isPremium = can(Features.USE_AI_NUTRITION);

  // Resto do código de busca padrão para usuários não-premium
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);
  const [foodServings, setFoodServings] = useState<Record<string, number>>({});
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Se selectedMealId está definido, não permite seleção múltipla - adiciona direto naquela refeição
  const isSpecificMeal = !!selectedMealId;
  const [selectedMealIds, setSelectedMealIds] = useState<Set<string>>(() =>
    selectedMealId ? new Set([selectedMealId]) : new Set(),
  );

  // Debounce da busca (aguarda 500ms após parar de digitar)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isFetchingRef = useRef(false);
  const fetchIdRef = useRef(0);

  // Resetar paginação quando query ou categoria mudar
  useEffect(() => {
    setCurrentPage(0);
    setFoods([]);
    setHasMore(true);
  }, []);

  // Buscar alimentos da API (sem isLoading/isLoadingMore nas deps para evitar loop)
  const fetchFoods = useCallback(
    async (page: number, reset: boolean = false) => {
      // Load more: evitar chamadas concorrentes. Página 0: permitir (filtros mudaram)
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
        if (selectedCategory) {
          params.append("category", selectedCategory);
        }
        params.append("limit", ITEMS_PER_PAGE.toString());
        if (page > 0) {
          params.append("offset", (page * ITEMS_PER_PAGE).toString());
        }

        const response = await apiClient.get<{ foods: FoodItem[] }>(
          `/api/foods/search?${params.toString()}`,
        );

        const newFoods = response.data.foods || [];
        if (id !== fetchIdRef.current) return; // Resposta obsoleta, descartar

        if (reset || page === 0) {
          setFoods(newFoods);
        } else {
          setFoods((prev) => [...prev, ...newFoods]);
        }

        setHasMore(newFoods.length === ITEMS_PER_PAGE);
      } catch (error) {
        if (id !== fetchIdRef.current) return;
        console.error("[FoodSearch] Erro ao buscar alimentos:", error);
        if (page === 0) {
          setFoods([]);
        }
        setHasMore(false);
      } finally {
        if (id === fetchIdRef.current) isFetchingRef.current = false;
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [debouncedQuery, selectedCategory],
  );

  // Carregar primeira página quando query ou categoria mudar
  useEffect(() => {
    fetchFoods(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFoods]);

  // Carregar próxima página quando currentPage mudar (exceto página 0)
  useEffect(() => {
    if (currentPage > 0) {
      fetchFoods(currentPage, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, fetchFoods]);

  // Scroll infinito - detectar quando está perto do final
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
        // O useEffect acima vai chamar fetchFoods quando currentPage mudar
        setTimeout(() => {
          isFetching = false;
        }, 1000); // Prevenir múltiplas chamadas rápidas
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoadingMore, isLoading]);

  const getMealIcon = (type: string, name?: string) => {
    // Se o tipo for snack, tenta determinar pelo nome
    if (type === "snack" && name) {
      if (name.includes("Café da Tarde")) return mealIcons["afternoon-snack"];
      if (name.includes("Pré Treino") || name.includes("Pré"))
        return mealIcons["pre-workout"];
      if (name.includes("Pós Treino") || name.includes("Pós"))
        return mealIcons["post-workout"];
    }
    return mealIcons[type] || "🍴";
  };

  const getMealTime = (type: string, name?: string) => {
    // Se o tipo for snack, tenta determinar pelo nome
    if (type === "snack" && name) {
      if (name.includes("Café da Tarde")) return mealTimes["afternoon-snack"];
      if (name.includes("Pré Treino") || name.includes("Pré"))
        return mealTimes["pre-workout"];
      if (name.includes("Pós Treino") || name.includes("Pós"))
        return mealTimes["post-workout"];
    }
    return mealTimes[type] || type;
  };

  const handleFoodSelection = (foodId: string) => {
    setSelectedFoodIds((prev) => {
      if (prev.includes(foodId)) {
        // Remove o alimento e suas porções
        const newServings = { ...foodServings };
        delete newServings[foodId];
        setFoodServings(newServings);
        return prev.filter((id) => id !== foodId);
      } else {
        // Adiciona o alimento com 1 porção padrão
        setFoodServings((prev) => ({ ...prev, [foodId]: 1 }));
        return [...prev, foodId];
      }
    });
  };

  const handleServingsChange = (foodId: string, delta: number) => {
    setFoodServings((prev) => {
      const current = prev[foodId] || 1;
      const newValue = Math.max(0.5, current + delta);
      return { ...prev, [foodId]: newValue };
    });
  };

  const handleAddFoods = () => {
    if (selectedFoodIds.length > 0 && selectedMealIds.size > 0) {
      const foodsToAdd = selectedFoodIds
        .map((foodId) => {
          // Buscar alimento no array foods (vindos da API)
          const food = foods.find((f: FoodItem) => f.id === foodId);
          if (!food) return null;
          return {
            food,
            servings: foodServings[foodId] || 1,
          };
        })
        .filter(Boolean) as Array<{ food: FoodItem; servings: number }>;

      if (foodsToAdd.length > 0) {
        onAddFood(foodsToAdd, Array.from(selectedMealIds));
        // Resetar seleções
        setSelectedFoodIds([]);
        setFoodServings({});
        onClose();
      }
    }
  };

  const handleToggleMeal = (mealId: string) => {
    setSelectedMealIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(mealId)) {
        newSet.delete(mealId);
      } else {
        newSet.add(mealId);
      }
      return newSet;
    });
    if (onSelectMeal) {
      onSelectMeal(mealId);
    }
  };

  const hasSelectedMeals = selectedMealIds.size > 0;
  const hasSelectedFoods = selectedFoodIds.length > 0;

  // Se premium, renderizar chat ao invés de busca
  if (isPremium) {
    return (
      <FoodSearchChat
        onAddFood={onAddFood}
        onAddMeal={onAddMeal || (() => {})}
        onClose={onClose}
        selectedMealId={selectedMealId}
        meals={meals}
      />
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            duration: 0.3,
          }}
          className="w-full max-w-2xl rounded-t-3xl bg-duo-bg-card sm:rounded-3xl sm:scale-100"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="border-b-2 border-duo-border p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-duo-text">
                Adicionar Alimento
              </h2>
              <DuoButton
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-full"
              >
                ✕
              </DuoButton>
            </div>

            {!isSpecificMeal && meals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="mb-4"
              >
                <div className="mb-2 block text-sm font-bold text-duo-fg-muted">
                  Selecione as refeições ({selectedMealIds.size} selecionada
                  {selectedMealIds.size !== 1 ? "s" : ""}):
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {meals.map((meal, _index) => {
                    const isSelected = selectedMealIds.has(meal.id);
                    return (
                      <DuoButton
                        key={meal.id}
                        type="button"
                        variant="outline"
                        onClick={() => handleToggleMeal(meal.id)}
                        className={cn(
                          "relative rounded-xl border-2 p-3 justify-start text-left",
                          isSelected
                            ? "border-duo-green bg-duo-green/10 shadow-[0_2px_0_#58A700]"
                            : "border-duo-border bg-duo-bg-card shadow-[0_2px_0_#D1D5DB] hover:border-duo-green/50",
                        )}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-duo-green text-white text-xs"
                          >
                            ✓
                          </motion.div>
                        )}
                        <div className="mb-1 text-2xl">
                          {getMealIcon(meal.type, meal.name)}
                        </div>
                        <div className="text-xs font-bold text-duo-text">
                          {meal.name}
                        </div>
                        <div className="text-xs text-duo-fg-muted">
                          {getMealTime(meal.type, meal.name)}
                        </div>
                      </DuoButton>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {isSpecificMeal && meals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="mb-4 rounded-xl border-2 border-duo-green bg-duo-green/10 p-3"
              >
                <div className="flex items-center gap-2">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
                    className="text-xl"
                  >
                    {getMealIcon(
                      meals.find((m) => m.id === selectedMealId)?.type || "",
                      meals.find((m) => m.id === selectedMealId)?.name,
                    )}
                  </motion.span>
                  <div>
                    <div className="text-sm font-bold text-duo-text">
                      {meals.find((m) => m.id === selectedMealId)?.name}
                    </div>
                    <div className="text-xs text-duo-fg-muted">
                      {getMealTime(
                        meals.find((m) => m.id === selectedMealId)?.type || "",
                        meals.find((m) => m.id === selectedMealId)?.name,
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Filtros por categoria */}
            <div className="mb-4">
              <div className="mb-2 block text-sm font-bold text-duo-fg-muted">
                Categoria:
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <DuoButton
                    key={category.value}
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedCategory(category.value)}
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
            </div>

            {/* Campo de busca */}
            <DuoInput.Simple
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar alimentos..."
              leftIcon={<Search className="h-5 w-5" />}
              className="font-bold"
            />
          </motion.div>

          {/* Lista de alimentos com scroll infinito */}
          <motion.div
            ref={scrollContainerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="flex-1 overflow-y-auto p-6"
            style={{ maxHeight: "50vh" }}
          >
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 text-duo-fg-muted"
              >
                <Loader2 className="mb-2 h-8 w-8 animate-spin text-duo-green" />
                <div className="text-sm font-bold">Carregando alimentos...</div>
              </motion.div>
            ) : foods.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center text-duo-fg-muted"
              >
                {debouncedQuery || selectedCategory
                  ? `Nenhum alimento encontrado${
                      debouncedQuery ? ` para "${debouncedQuery}"` : ""
                    }${selectedCategory ? ` na categoria selecionada` : ""}`
                  : "Digite algo para buscar ou selecione uma categoria"}
              </motion.div>
            ) : (
              <>
                <div className="space-y-3">
                  {foods.map((food, idx) => {
                    const isSelected = selectedFoodIds.includes(food.id);
                    return (
                      <motion.div
                        key={food.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.2 }}
                      >
                        <DuoCard.Root
                          variant={isSelected ? "highlighted" : "interactive"}
                          padding="md"
                          className="cursor-pointer"
                          onClick={() => handleFoodSelection(food.id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="mb-1.5 font-bold text-[var(--duo-fg)]">
                                {food.name}
                              </div>
                              <div className="mb-2 text-xs text-[var(--duo-fg-muted)]">
                                {food.servingSize}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="rounded-full bg-[var(--duo-primary)]/20 px-2 py-0.5 text-xs font-bold text-[var(--duo-primary)]">
                                  {food.calories} cal
                                </span>
                                <span className="rounded-full bg-[var(--duo-border)] px-2 py-0.5 text-xs font-bold text-[var(--duo-fg-muted)]">
                                  P: {food.protein}g
                                </span>
                                <span className="rounded-full bg-[var(--duo-border)] px-2 py-0.5 text-xs font-bold text-[var(--duo-fg-muted)]">
                                  C: {food.carbs}g
                                </span>
                                <span className="rounded-full bg-[var(--duo-border)] px-2 py-0.5 text-xs font-bold text-[var(--duo-fg-muted)]">
                                  G: {food.fats}g
                                </span>
                              </div>
                            </div>
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
                        </DuoCard.Root>
                      </motion.div>
                    );
                  })}
                </div>
                {isLoadingMore && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center py-4"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-duo-green" />
                    <span className="ml-2 text-sm text-duo-fg-muted">
                      Carregando mais alimentos...
                    </span>
                  </motion.div>
                )}
                {!hasMore && foods.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-4 text-center text-xs text-duo-fg-muted"
                  >
                    Todos os alimentos foram carregados ({foods.length} total)
                  </motion.div>
                )}
              </>
            )}
          </motion.div>

          <AnimatePresence>
            {hasSelectedFoods && (isSpecificMeal || hasSelectedMeals) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="border-t-2 border-duo-border p-6 space-y-4"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="mb-3 block text-sm font-bold text-[var(--duo-fg-muted)]">
                    Ajustar Porções ({selectedFoodIds.length} alimento
                    {selectedFoodIds.length !== 1 ? "s" : ""} selecionado
                    {selectedFoodIds.length !== 1 ? "s" : ""})
                  </div>
                  <div
                    className="space-y-3 overflow-y-auto scrollbar-hide"
                    style={{ maxHeight: "240px" }}
                  >
                    <AnimatePresence>
                      {selectedFoodIds.map((foodId, index) => {
                        const food = foods.find(
                          (f: FoodItem) => f.id === foodId,
                        );
                        if (!food) return null;
                        const servings = foodServings[foodId] || 1;
                        return (
                          <motion.div
                            key={foodId}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, height: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.2 }}
                          >
                            <DuoCard.Root
                              variant="outlined"
                              padding="sm"
                              className="flex items-center justify-between gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-[var(--duo-fg)]">
                                  {food.name}
                                </div>
                                <div className="text-xs text-[var(--duo-fg-muted)]">
                                  {food.servingSize}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <DuoButton
                                  variant="outline"
                                  size="icon-sm"
                                  onClick={() =>
                                    handleServingsChange(foodId, -0.5)
                                  }
                                  className="h-8 w-8 rounded-full"
                                >
                                  <Minus className="h-4 w-4" />
                                </DuoButton>
                                <div className="w-16 text-center">
                                  <div className="text-sm font-bold text-[var(--duo-fg)]">
                                    {servings}
                                  </div>
                                  <div className="text-xs text-[var(--duo-fg-muted)]">
                                    {servings === 1 ? "porção" : "porções"}
                                  </div>
                                </div>
                                <DuoButton
                                  variant="primary"
                                  size="icon-sm"
                                  onClick={() =>
                                    handleServingsChange(foodId, 0.5)
                                  }
                                  className="h-8 w-8 rounded-full"
                                >
                                  <Plus className="h-4 w-4" />
                                </DuoButton>
                              </div>
                            </DuoCard.Root>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
                <DuoButton
                  onClick={handleAddFoods}
                  variant="primary"
                  className="w-full"
                >
                  <Plus className="h-5 w-5" />
                  {isSpecificMeal
                    ? `ADICIONAR ${selectedFoodIds.length} ALIMENTO${
                        selectedFoodIds.length !== 1 ? "S" : ""
                      }`
                    : `ADICIONAR ${selectedFoodIds.length} ALIMENTO${
                        selectedFoodIds.length !== 1 ? "S" : ""
                      } EM ${selectedMealIds.size} REFEIÇÃO${
                        selectedMealIds.size > 1 ? "ÕES" : ""
                      }`}
                </DuoButton>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {hasSelectedFoods &&
              !isSpecificMeal &&
              !hasSelectedMeals &&
              meals.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="border-t-2 border-duo-border p-6"
                >
                  <div className="rounded-xl border-2 border-duo-orange bg-duo-orange/10 p-4 text-center text-sm font-bold text-duo-orange">
                    Selecione pelo menos uma refeição para adicionar o(s)
                    alimento(s)
                  </div>
                </motion.div>
              )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export const FoodSearch = { Simple: FoodSearchSimple };
