"use client";

import { useState } from "react";
import { useNutritionStore, useUIStore } from "@/stores";
import type { FoodItem } from "@/lib/types";

export function useNutritionHandlers() {
  const {
    dailyNutrition,
    toggleMealComplete,
    addFoodToMeal,
    addMeal,
    removeMeal,
    removeFoodFromMeal,
    updateWaterIntake,
  } = useNutritionStore();
  const { setShowFoodSearch } = useUIStore();
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
    const glassSize = 250;
    const currentGlasses = Math.floor(dailyNutrition.waterIntake / glassSize);

    if (index < currentGlasses) {
      const newAmount = Math.max(0, dailyNutrition.waterIntake - glassSize);
      updateWaterIntake(newAmount);
    } else {
      const newAmount = Math.min(
        dailyNutrition.targetWater,
        dailyNutrition.waterIntake + glassSize
      );
      updateWaterIntake(newAmount);
    }
  };

  const handleCloseFoodSearch = () => {
    setShowFoodSearch(false);
    setSelectedMealId(null);
  };

  const handleAddMealSubmit = (mealsData: Parameters<typeof addMeal>[0][]) => {
    mealsData.forEach((mealData) => {
      addMeal(mealData);
    });
  };

  return {
    dailyNutrition,
    selectedMealId,
    showAddMealModal,
    setSelectedMealId,
    setShowAddMealModal,
    handleMealComplete,
    handleAddFoodToMeal,
    handleAddFood,
    handleToggleWaterGlass,
    handleCloseFoodSearch,
    handleAddMealSubmit,
    removeMeal,
    removeFoodFromMeal,
  };
}
