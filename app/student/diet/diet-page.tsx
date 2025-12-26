"use client";

import { useEffect } from "react";
import { NutritionTracker } from "@/components/organisms/trackers/nutrition-tracker";
import { FoodSearch } from "@/components/organisms/modals/food-search";
import { AddMealModal } from "@/components/organisms/modals/add-meal-modal";
import { Calendar, TrendingUp } from "lucide-react";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { useNutritionHandlers } from "@/hooks/use-nutrition-handlers";
import { useStudent } from "@/hooks/use-student";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";
import { useModalState, useModalStateWithParam } from "@/hooks/use-modal-state";

export function DietPage() {
  // Carregar alimentos automaticamente ao entrar na página
  const foodDatabase = useStudent("foodDatabase");
  const store = useStudentUnifiedStore();

  // Modais controlados por search params
  const addMealModal = useModalState("add-meal");
  const foodSearchModal = useModalStateWithParam("food-search", "mealId");

  useEffect(() => {
    // Carregar alimentos se não tiver no store ou se estiver vazio
    if (!foodDatabase || foodDatabase.length === 0) {
      // Acessar a função diretamente do store para evitar problemas com cache do HMR
      const loadFoodDatabase = store.loadFoodDatabase;
      
      // Verificar se a função existe antes de chamar
      if (loadFoodDatabase && typeof loadFoodDatabase === "function") {
        loadFoodDatabase().catch((error) => {
          console.error("Erro ao carregar alimentos:", error);
        });
      } else {
        console.warn(
          "⚠️ loadFoodDatabase não está disponível. O cache do HMR pode estar desatualizado. Tente reiniciar o servidor de desenvolvimento."
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodDatabase]);
  const {
    dailyNutrition,
    selectedMealId,
    handleMealComplete,
    handleAddFoodToMeal,
    handleAddFood,
    handleToggleWaterGlass,
    handleAddMealSubmit,
    setSelectedMealId,
    removeMeal,
    removeFoodFromMeal,
  } = useNutritionHandlers();

  // Sincronizar selectedMealId com search param
  useEffect(() => {
    if (selectedMealId && !foodSearchModal.paramValue) {
      foodSearchModal.setParamValue(selectedMealId);
    }
  }, [selectedMealId, foodSearchModal]);

  // Handler para abrir food search com mealId
  const handleOpenFoodSearch = (mealId?: string) => {
    if (mealId) {
      setSelectedMealId(mealId);
      foodSearchModal.open(mealId);
    } else {
      foodSearchModal.open();
    }
  };

  // Handler para fechar food search
  const handleCloseFoodSearch = () => {
    foodSearchModal.close();
    setSelectedMealId(null);
  };

  const completedMeals = dailyNutrition.meals.filter((m) => m.completed).length;
  const totalMeals = dailyNutrition.meals.length;
  const caloriesPercentage = Math.round(
    (dailyNutrition.totalCalories / dailyNutrition.targetCalories) * 100
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-duo-text">Nutrição</h1>
        <p className="text-sm text-duo-gray-dark">
          {completedMeals} de {totalMeals} refeições concluídas hoje
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCardLarge
          icon={Calendar}
          value={`${completedMeals}/${totalMeals}`}
          label="refeições hoje"
          iconColor="duo-blue"
        />
        <StatCardLarge
          icon={TrendingUp}
          value={`${caloriesPercentage}%`}
          label="meta calórica"
          iconColor="duo-green"
        />
      </div>

      <NutritionTracker
        nutrition={dailyNutrition}
        onMealComplete={handleMealComplete}
        onAddMeal={addMealModal.open}
        onAddFoodToMeal={handleOpenFoodSearch}
        onDeleteMeal={removeMeal}
        onDeleteFood={removeFoodFromMeal}
        onToggleWaterGlass={handleToggleWaterGlass}
      />

      {addMealModal.isOpen && (
        <AddMealModal
          onClose={addMealModal.close}
          onAddMeal={(mealsData) => {
            handleAddMealSubmit(mealsData);
            addMealModal.close();
          }}
        />
      )}

      {foodSearchModal.isOpen && (
        <FoodSearch
          onAddFood={handleAddFood}
          onClose={handleCloseFoodSearch}
          selectedMealId={foodSearchModal.paramValue || selectedMealId}
          meals={dailyNutrition.meals}
          onSelectMeal={(mealId) => {
            setSelectedMealId(mealId);
            foodSearchModal.setParamValue(mealId);
          }}
        />
      )}
    </div>
  );
}
