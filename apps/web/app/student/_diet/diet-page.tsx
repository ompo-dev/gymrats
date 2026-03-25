/**
 * Pagina de dieta/nutricao do student.
 *
 * Arquitetura atual:
 * - bootstrap bridge da aba alimenta o store
 * - Zustand mantem a ponte otimista da UI
 * - o carregamento remoto permanece centralizado no bootstrap
 */

"use client";

import { Calendar, TrendingUp } from "lucide-react";
import { useEffect, useRef } from "react";
import { DuoStatCard, DuoStatsGrid } from "@/components/duo";
import { AddMealModal } from "@/components/organisms/modals/add-meal-modal";
import { FoodSearch } from "@/components/organisms/modals/food-search";
import { NutritionTracker } from "@/components/organisms/trackers/nutrition-tracker";
import { useModalState, useModalStateWithParam } from "@/hooks/use-modal-state";
import { useNutritionHandlers } from "@/hooks/use-nutrition-handlers";
import { useStudent } from "@/hooks/use-student";
import { useStudentDietBootstrapBridge } from "@/hooks/use-student-bootstrap";
import type { FoodItem } from "@/lib/types";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";

export function DietPage() {
  useStudentDietBootstrapBridge();

  const foodDatabase = useStudent("foodDatabase");
  const resolvedFoodDatabase = Array.isArray(foodDatabase)
    ? (foodDatabase as FoodItem[])
    : [];
  const loadFoodDatabase = useStudentUnifiedStore(
    (state) => state.loadFoodDatabase,
  );
  const hasRequestedFoodDatabaseRef = useRef(false);

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
  const { open: openNutritionLibrary } = nutritionLibraryModal;

  // `foodDatabase` segue fora do bootstrap base para nao inflar payload.
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

  useEffect(() => {
    if (!selectedMealId) return;
    if (foodSearchMealId === selectedMealId) return;
    setFoodSearchMealId(selectedMealId);
  }, [selectedMealId, foodSearchMealId, setFoodSearchMealId]);

  const handleOpenFoodSearch = (mealId?: string) => {
    if (mealId) {
      setSelectedMealId(mealId);
      openFoodSearchModal(mealId);
    } else {
      openFoodSearchModal();
    }
  };

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
        <h1 className="mb-2 text-3xl font-bold text-duo-text">Nutricao</h1>
        <p className="text-sm text-duo-gray-dark">
          {completedMeals} de {totalMeals} refeicoes concluidas hoje
        </p>
      </div>

      <DuoStatsGrid.Root columns={2} className="gap-4">
        <DuoStatCard.Simple
          icon={Calendar}
          value={`${completedMeals}/${totalMeals}`}
          label="refeicoes hoje"
          iconColor="var(--duo-secondary)"
        />
        <DuoStatCard.Simple
          icon={TrendingUp}
          value={`${caloriesPercentage}%`}
          label="meta calorica"
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
    </div>
  );
}
