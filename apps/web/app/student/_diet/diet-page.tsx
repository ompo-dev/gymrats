/**
 * Página de Dieta/Nutrição do Student
 *
 * Arquitetura Offline-First:
 * - Usa apenas dados do store unificado (via useStudent hook)
 * - Não recebe props SSR (dados vêm do store)
 * - Funciona offline com dados em cache
 * - Sincronização automática via syncManager
 * - Dados carregados automaticamente pelo useStudentInitializer no layout
 */

"use client";

import { Calendar, TrendingUp } from "lucide-react";
import { useEffect, useRef } from "react";
import { DuoStatCard, DuoStatsGrid } from "@/components/duo";
import { AddMealModal } from "@/components/organisms/modals/add-meal-modal";
import { FoodSearch } from "@/components/organisms/modals/food-search";
import { NutritionLibraryModal } from "@/components/organisms/modals/nutrition-library-modal";
import { NutritionTracker } from "@/components/organisms/trackers/nutrition-tracker";
import { useLoadPrioritized } from "@/hooks/use-load-prioritized";
import { useModalState, useModalStateWithParam } from "@/hooks/use-modal-state";
import { useNutritionHandlers } from "@/hooks/use-nutrition-handlers";
import { useStudent } from "@/hooks/use-student";
import type { FoodItem } from "@/lib/types";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";

export function DietPage() {
  // Carregamento prioritizado: dailyNutrition e progress aparecem primeiro
  // Se dados já existem no store, só carrega o que falta
  useLoadPrioritized({ context: "diet" });

  // ============================================
  // DADOS DO STORE UNIFICADO (Offline-First)
  // ============================================
  // Todos os dados vêm do store unificado, que:
  // - É carregado automaticamente pelo useStudentInitializer no layout
  // - Persiste em IndexedDB (funciona offline)
  // - Sincroniza automaticamente via syncManager
  // - Usa rotas específicas otimizadas (3-5x mais rápido)

  const foodDatabase = useStudent("foodDatabase");
  const resolvedFoodDatabase = Array.isArray(foodDatabase)
    ? (foodDatabase as FoodItem[])
    : [];
  const loadFoodDatabase = useStudentUnifiedStore(
    (state) => state.loadFoodDatabase,
  );
  const loadNutrition = useStudentUnifiedStore((state) => state.loadNutrition);
  const hasRequestedFoodDatabaseRef = useRef(false);

  // Modais controlados por search params
  const addMealModal = useModalState("add-meal");
  const foodSearchModal = useModalStateWithParam("food-search", "mealId");
  const nutritionLibraryModal = useModalState("nutrition-library");
  const {
    isOpen: isAddMealOpen,
    open: openAddMeal,
    close: closeAddMeal,
  } = addMealModal;
  const {
    isOpen: isFoodSearchOpen,
    open: openFoodSearchModal,
    close: closeFoodSearchModal,
    paramValue: foodSearchMealId,
    setParamValue: setFoodSearchMealId,
  } = foodSearchModal;
  const {
    open: openNutritionLibrary,
  } = nutritionLibraryModal;

  // Carregar foodDatabase apenas se não estiver no store
  // O useStudentInitializer já carrega a maioria dos dados, mas foodDatabase
  // pode não ser carregado automaticamente (é grande e opcional)
  useEffect(() => {
    if (resolvedFoodDatabase.length > 0) {
      hasRequestedFoodDatabaseRef.current = true;
      return;
    }

    if (hasRequestedFoodDatabaseRef.current) {
      return;
    }

    hasRequestedFoodDatabaseRef.current = true;
    loadFoodDatabase().catch((error) => {
      console.error("[DietPage] Erro ao carregar foodDatabase:", error);
    });
  }, [loadFoodDatabase, resolvedFoodDatabase.length]);
  const {
    dailyNutrition,
    selectedMealId,
    handleMealComplete,
    handleAddFoodToMeal: _handleAddFoodToMeal,
    handleAddFood,
    handleToggleWaterGlass,
    handleAddMealSubmit,
    setSelectedMealId,
    removeMeal,
    removeFoodFromMeal,
  } = useNutritionHandlers();

  // Sincronizar selectedMealId com search param
  useEffect(() => {
    if (!selectedMealId) return;
    if (foodSearchMealId === selectedMealId) return;
    setFoodSearchMealId(selectedMealId);
  }, [selectedMealId, foodSearchMealId, setFoodSearchMealId]);

  // Handler para abrir food search com mealId
  const handleOpenFoodSearch = (mealId?: string) => {
    if (mealId) {
      setSelectedMealId(mealId);
      openFoodSearchModal(mealId);
    } else {
      openFoodSearchModal();
    }
  };

  // Handler para fechar food search
  const handleCloseFoodSearch = () => {
    closeFoodSearchModal();
    setSelectedMealId(null);
  };

  const completedMeals = dailyNutrition.meals.filter((m) => m.completed).length;
  const totalMeals = dailyNutrition.meals.length;
  const caloriesPercentage = Math.round(
    (dailyNutrition.totalCalories / dailyNutrition.targetCalories) * 100,
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-duo-text">Nutrição</h1>
        <p className="text-sm text-duo-gray-dark">
          {completedMeals} de {totalMeals} refeições concluídas hoje
        </p>
      </div>

      <DuoStatsGrid.Root columns={2} className="gap-4">
        <DuoStatCard.Simple
          icon={Calendar}
          value={`${completedMeals}/${totalMeals}`}
          label="refeições hoje"
          iconColor="var(--duo-secondary)"
        />
        <DuoStatCard.Simple
          icon={TrendingUp}
          value={`${caloriesPercentage}%`}
          label="meta calórica"
          iconColor="var(--duo-primary)"
        />
      </DuoStatsGrid.Root>

      <NutritionTracker.Simple
        nutrition={dailyNutrition}
        onMealComplete={handleMealComplete}
        onAddMeal={openAddMeal}
        onOpenLibrary={openNutritionLibrary}
        onAddFoodToMeal={handleOpenFoodSearch}
        onDeleteMeal={removeMeal}
        onDeleteFood={removeFoodFromMeal}
        onToggleWaterGlass={handleToggleWaterGlass}
      />

      {isAddMealOpen && (
        <AddMealModal.Simple
          onClose={closeAddMeal}
          onAddMeal={(mealsData) => {
            handleAddMealSubmit(mealsData);
            closeAddMeal();
          }}
        />
      )}

      {isFoodSearchOpen && (
        <FoodSearch.Simple
          onAddFood={handleAddFood}
          onAddMeal={handleAddMealSubmit}
          onClose={handleCloseFoodSearch}
          selectedMealId={foodSearchMealId || selectedMealId}
          meals={dailyNutrition.meals}
          foodDatabase={resolvedFoodDatabase}
          onSelectMeal={(mealId) => {
            setSelectedMealId(mealId);
            setFoodSearchMealId(mealId);
          }}
        />
      )}

      <NutritionLibraryModal
        onPlansSynced={async () => {
          await loadNutrition();
        }}
      />
    </div>
  );
}
