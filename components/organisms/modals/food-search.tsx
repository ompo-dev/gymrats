"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { FoodItem, Meal } from "@/lib/types";
import { Search, Plus, Minus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { OptionSelector } from "@/components/molecules/selectors/option-selector";
import { Button } from "@/components/atoms/buttons/button";
import { cn } from "@/lib/utils";
import { useStudent } from "@/hooks/use-student";
import { apiClient } from "@/lib/api/client";

interface FoodSearchProps {
  onAddFood: (
    foods: Array<{ food: FoodItem; servings: number }>,
    mealIds: string[]
  ) => void;
  onClose: () => void;
  selectedMealId?: string | null;
  meals?: Meal[];
  onSelectMeal?: (mealId: string) => void;
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

export function FoodSearch({
  onAddFood,
  onClose,
  selectedMealId,
  meals = [],
  onSelectMeal,
}: FoodSearchProps) {
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
    selectedMealId ? new Set([selectedMealId]) : new Set()
  );

  // Debounce da busca (aguarda 500ms após parar de digitar)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Resetar paginação quando query ou categoria mudar
  useEffect(() => {
    setCurrentPage(0);
    setFoods([]);
    setHasMore(true);
  }, [debouncedQuery, selectedCategory]);

  // Buscar alimentos da API
  const fetchFoods = useCallback(
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
        if (selectedCategory) {
          params.append("category", selectedCategory);
        }
        params.append("limit", ITEMS_PER_PAGE.toString());

        const response = await apiClient.get<{ foods: FoodItem[] }>(
          `/api/foods/search?${params.toString()}`
        );

        const newFoods = response.data.foods || [];

        if (reset || page === 0) {
          setFoods(newFoods);
        } else {
          setFoods((prev) => [...prev, ...newFoods]);
        }

        // Se retornou menos que o limite, não há mais páginas
        setHasMore(newFoods.length === ITEMS_PER_PAGE);
      } catch (error) {
        console.error("[FoodSearch] Erro ao buscar alimentos:", error);
        if (page === 0) {
          setFoods([]);
        }
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [debouncedQuery, selectedCategory, isLoading, isLoadingMore]
  );

  // Carregar primeira página quando query ou categoria mudar
  useEffect(() => {
    fetchFoods(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, selectedCategory]);

  // Carregar próxima página quando currentPage mudar (exceto página 0)
  useEffect(() => {
    if (currentPage > 0) {
      fetchFoods(currentPage, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

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

  // Prepara opções para o OptionSelector
  const foodOptions = foods.map((food: FoodItem) => ({
    value: food.id,
    label: food.name,
    description: `${food.calories} cal • P: ${food.protein}g • C: ${food.carbs}g • G: ${food.fats}g • ${food.servingSize}`,
  }));

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
          className="w-full max-w-2xl rounded-t-3xl bg-white sm:rounded-3xl sm:scale-100"
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
            className="border-b-2 border-gray-300 p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Adicionar Alimento
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✕
              </motion.button>
            </div>

            {!isSpecificMeal && meals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="mb-4"
              >
                <label className="mb-2 block text-sm font-bold text-gray-600">
                  Selecione as refeições ({selectedMealIds.size} selecionada
                  {selectedMealIds.size !== 1 ? "s" : ""}):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {meals.map((meal, index) => {
                    const isSelected = selectedMealIds.has(meal.id);
                    return (
                      <motion.button
                        key={meal.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: 0.2 + index * 0.05,
                          duration: 0.2,
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleToggleMeal(meal.id)}
                        className={cn(
                          "relative rounded-xl border-2 p-3 text-left transition-all",
                          isSelected
                            ? "border-duo-green bg-duo-green/10 shadow-[0_2px_0_#58A700]"
                            : "border-gray-300 bg-white shadow-[0_2px_0_#D1D5DB] hover:border-duo-green/50"
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
                        <div className="text-xs font-bold text-gray-900">
                          {meal.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {getMealTime(meal.type, meal.name)}
                        </div>
                      </motion.button>
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
                      meals.find((m) => m.id === selectedMealId)?.name
                    )}
                  </motion.span>
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {meals.find((m) => m.id === selectedMealId)?.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {getMealTime(
                        meals.find((m) => m.id === selectedMealId)?.type || "",
                        meals.find((m) => m.id === selectedMealId)?.name
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Filtros por categoria */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-bold text-gray-600">
                Categoria:
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <motion.button
                    key={category.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category.value)}
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
            </div>

            {/* Campo de busca */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar alimentos..."
                className="w-full rounded-xl border-2 border-gray-300 py-3 pl-12 pr-4 font-bold text-gray-900 placeholder:text-gray-400 focus:border-duo-blue focus:outline-none"
              />
            </div>
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
                className="flex flex-col items-center justify-center py-8 text-gray-600"
              >
                <Loader2 className="mb-2 h-8 w-8 animate-spin text-duo-green" />
                <div className="text-sm font-bold">Carregando alimentos...</div>
              </motion.div>
            ) : foods.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center text-gray-600"
              >
                {debouncedQuery || selectedCategory
                  ? `Nenhum alimento encontrado${
                      debouncedQuery ? ` para "${debouncedQuery}"` : ""
                    }${selectedCategory ? ` na categoria selecionada` : ""}`
                  : "Digite algo para buscar ou selecione uma categoria"}
              </motion.div>
            ) : (
              <>
                <OptionSelector
                  options={foodOptions}
                  value={selectedFoodIds}
                  onChange={handleFoodSelection}
                  multiple={true}
                  layout="list"
                  size="md"
                  textAlign="left"
                  animate={true}
                  delay={0.3}
                />
                {isLoadingMore && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center py-4"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-duo-green" />
                    <span className="ml-2 text-sm text-gray-600">
                      Carregando mais alimentos...
                    </span>
                  </motion.div>
                )}
                {!hasMore && foods.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-4 text-center text-xs text-gray-500"
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
                className="border-t-2 border-gray-300 p-6 space-y-4"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="mb-3 block text-sm font-bold text-gray-600">
                    Ajustar Porções ({selectedFoodIds.length} alimento
                    {selectedFoodIds.length !== 1 ? "s" : ""} selecionado
                    {selectedFoodIds.length !== 1 ? "s" : ""})
                  </label>
                  <div
                    className="space-y-3 overflow-y-auto scrollbar-hide"
                    style={{ maxHeight: "240px" }}
                  >
                    <AnimatePresence>
                      {selectedFoodIds.map((foodId, index) => {
                        // Buscar alimento no array foods (vindos da API)
                        const food = foods.find(
                          (f: FoodItem) => f.id === foodId
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
                            className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-gray-50 p-3"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-bold text-gray-900">
                                {food.name}
                              </div>
                              <div className="text-xs text-gray-600">
                                {food.servingSize}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() =>
                                  handleServingsChange(foodId, -0.5)
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white text-gray-700 transition-all hover:bg-gray-100 active:scale-90"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <div className="w-16 text-center">
                                <div className="text-sm font-bold text-gray-900">
                                  {servings}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {servings === 1 ? "porção" : "porções"}
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  handleServingsChange(foodId, 0.5)
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-duo-green bg-duo-green text-white transition-all hover:bg-duo-green/90 active:scale-90"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
                <Button onClick={handleAddFoods} className="w-full">
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
                </Button>
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
                  className="border-t-2 border-gray-300 p-6"
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
