"use client";

import { NutritionTracker } from "../../../components/nutrition-tracker";
import { FoodSearch } from "../../../components/food-search";
import { AddMealModal } from "../../../components/add-meal-modal";
import { Calendar, TrendingUp } from "lucide-react";
import { useUIStore } from "@/stores";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { useNutritionHandlers } from "@/hooks/use-nutrition-handlers";

export function DietPage() {
  const {
    dailyNutrition,
    selectedMealId,
    showAddMealModal,
    setShowAddMealModal,
    handleMealComplete,
    handleAddFoodToMeal,
    handleAddFood,
    handleToggleWaterGlass,
    handleCloseFoodSearch,
    handleAddMealSubmit,
    setSelectedMealId,
    removeMeal,
    removeFoodFromMeal,
  } = useNutritionHandlers();
  const { showFoodSearch } = useUIStore();

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
        onAddMeal={() => setShowAddMealModal(true)}
        onAddFoodToMeal={handleAddFoodToMeal}
        onDeleteMeal={removeMeal}
        onDeleteFood={removeFoodFromMeal}
        onToggleWaterGlass={handleToggleWaterGlass}
      />

      {showAddMealModal && (
        <AddMealModal
          onClose={() => setShowAddMealModal(false)}
          onAddMeal={handleAddMealSubmit}
        />
      )}

      {showFoodSearch && (
        <FoodSearch
          onAddFood={handleAddFood}
          onClose={handleCloseFoodSearch}
          selectedMealId={selectedMealId}
          meals={dailyNutrition.meals}
          onSelectMeal={setSelectedMealId}
        />
      )}
    </div>
  );
}
