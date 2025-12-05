"use client";

import { useState } from "react";
import { NutritionTracker } from "./nutrition-tracker";
import { FoodSearch } from "./food-search";
import { AddMealModal } from "./add-meal-modal";
import type { FoodItem } from "@/lib/types";
import { Calendar, TrendingUp } from "lucide-react";
import { useNutritionStore, useUIStore } from "@/stores";
import { StatCardLarge } from "@/components/ui/stat-card-large";

export function DietPage() {
  const {
    dailyNutrition,
    toggleMealComplete,
    addFoodToMeal,
    addMeal,
    removeMeal,
    removeFoodFromMeal,
    updateWaterIntake,
  } = useNutritionStore();
  const { showFoodSearch, setShowFoodSearch } = useUIStore();
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [showAddMealModal, setShowAddMealModal] = useState(false);

  const handleMealComplete = (mealId: string) => {
    toggleMealComplete(mealId);
  };

  const handleAddFoodToMeal = (mealId: string) => {
    setSelectedMealId(mealId);
    setShowFoodSearch(true);
  };

  const handleAddFood = (
    foods: Array<{ food: FoodItem; servings: number }>,
    mealIds: string[]
  ) => {
    if (mealIds.length > 0 && foods.length > 0) {
      mealIds.forEach((mealId) => {
        foods.forEach(({ food, servings }) => {
          addFoodToMeal(mealId, food, servings);
        });
      });
      setSelectedMealId(null);
      setShowFoodSearch(false);
    }
  };

  const handleToggleWaterGlass = (index: number) => {
    const glassSize = 250; // ml por copo
    const currentGlasses = Math.floor(dailyNutrition.waterIntake / glassSize);

    if (index < currentGlasses) {
      // Remove copo
      const newAmount = Math.max(0, dailyNutrition.waterIntake - glassSize);
      updateWaterIntake(newAmount);
    } else {
      // Adiciona copo
      const newAmount = Math.min(
        dailyNutrition.targetWater,
        dailyNutrition.waterIntake + glassSize
      );
      updateWaterIntake(newAmount);
    }
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
        onAddMeal={() => setShowAddMealModal(true)}
        onAddFoodToMeal={handleAddFoodToMeal}
        onDeleteMeal={removeMeal}
        onDeleteFood={removeFoodFromMeal}
        onToggleWaterGlass={handleToggleWaterGlass}
      />

      {showAddMealModal && (
        <AddMealModal
          onClose={() => setShowAddMealModal(false)}
          onAddMeal={(mealsData) => {
            mealsData.forEach((mealData) => {
              addMeal(mealData);
            });
          }}
        />
      )}

      {showFoodSearch && (
        <FoodSearch
          onAddFood={handleAddFood}
          onClose={() => {
            setShowFoodSearch(false);
            setSelectedMealId(null);
          }}
          selectedMealId={selectedMealId}
          meals={dailyNutrition.meals}
          onSelectMeal={(mealId) => setSelectedMealId(mealId)}
        />
      )}
    </div>
  );
}
