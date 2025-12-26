"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUIStore } from "@/stores";
import { useStudent } from "@/hooks/use-student";
import type { FoodItem } from "@/lib/types";
import type { DailyNutrition } from "@/lib/types/student-unified";

export function useNutritionHandlers() {
  // Usar hook unificado com seletor direto do Zustand para garantir reatividade
  const storeNutrition = useStudent("dailyNutrition");
  const { updateNutrition } = useStudent("actions");
  
  // Fallback para dados iniciais se store ainda não carregou
  // Usar useMemo para garantir que o objeto seja recriado quando storeNutrition mudar
  const dailyNutrition = useMemo(() => storeNutrition || {
    date: new Date().toISOString().split("T")[0],
    meals: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
    waterIntake: 0,
    targetCalories: 2000,
    targetProtein: 150,
    targetCarbs: 250,
    targetFats: 65,
    targetWater: 2000,
  }, [storeNutrition]);
  const { setShowFoodSearch } = useUIStore();
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Helpers para atualizar nutrição usando store unificado
  const toggleMealComplete = (mealId: string) => {
    const updatedMeals = dailyNutrition.meals.map((meal) =>
      meal.id === mealId ? { ...meal, completed: !meal.completed } : meal
    );
    updateNutrition({ meals: updatedMeals });
  };

  const addFoodToMeal = (
    mealId: string,
    food: FoodItem,
    servings: number
  ) => {
    const updatedMeals = dailyNutrition.meals.map((meal) => {
      if (meal.id === mealId) {
        const newFood = {
          id: `food-${Date.now()}`,
          foodId: food.id,
          foodName: food.name,
          servings,
          calories: food.calories * servings,
          protein: food.protein * servings,
          carbs: food.carbs * servings,
          fats: food.fats * servings,
          servingSize: food.servingSize,
        };
        const updatedFoods = [...(meal.foods || []), newFood];
        const updatedMeal = {
          ...meal,
          foods: updatedFoods,
          calories: meal.calories + newFood.calories,
          protein: meal.protein + newFood.protein,
          carbs: meal.carbs + newFood.carbs,
          fats: meal.fats + newFood.fats,
        };
        return updatedMeal;
      }
      return meal;
    });
    const totalCalories = updatedMeals.reduce((sum, m) => sum + m.calories, 0);
    const totalProtein = updatedMeals.reduce((sum, m) => sum + m.protein, 0);
    const totalCarbs = updatedMeals.reduce((sum, m) => sum + m.carbs, 0);
    const totalFats = updatedMeals.reduce((sum, m) => sum + m.fats, 0);
    updateNutrition({
      meals: updatedMeals,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
    });
  };

  const addMeal = (mealData: {
    name: string;
    type: string;
    time?: string;
  }) => {
    const newMeal = {
      id: `meal-${Date.now()}`,
      name: mealData.name,
      type: mealData.type,
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      completed: false,
      time: mealData.time,
      foods: [],
    };
    updateNutrition({
      meals: [...dailyNutrition.meals, newMeal],
    });
  };

  const removeMeal = (mealId: string) => {
    const updatedMeals = dailyNutrition.meals.filter((m) => m.id !== mealId);
    const totalCalories = updatedMeals.reduce((sum, m) => sum + m.calories, 0);
    const totalProtein = updatedMeals.reduce((sum, m) => sum + m.protein, 0);
    const totalCarbs = updatedMeals.reduce((sum, m) => sum + m.carbs, 0);
    const totalFats = updatedMeals.reduce((sum, m) => sum + m.fats, 0);
    updateNutrition({
      meals: updatedMeals,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
    });
  };

  const removeFoodFromMeal = (mealId: string, foodId: string) => {
    const updatedMeals = dailyNutrition.meals.map((meal) => {
      if (meal.id === mealId) {
        const foodToRemove = meal.foods?.find((f) => f.id === foodId);
        if (foodToRemove) {
          const updatedFoods = meal.foods?.filter((f) => f.id !== foodId) || [];
          return {
            ...meal,
            foods: updatedFoods,
            calories: meal.calories - foodToRemove.calories,
            protein: meal.protein - foodToRemove.protein,
            carbs: meal.carbs - foodToRemove.carbs,
            fats: meal.fats - foodToRemove.fats,
          };
        }
      }
      return meal;
    });
    const totalCalories = updatedMeals.reduce((sum, m) => sum + m.calories, 0);
    const totalProtein = updatedMeals.reduce((sum, m) => sum + m.protein, 0);
    const totalCarbs = updatedMeals.reduce((sum, m) => sum + m.carbs, 0);
    const totalFats = updatedMeals.reduce((sum, m) => sum + m.fats, 0);
    updateNutrition({
      meals: updatedMeals,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
    });
  };

  const updateWaterIntake = (amount: number) => {
    updateNutrition({ waterIntake: amount });
  };

  const setDailyNutrition = (nutrition: DailyNutrition) => {
    updateNutrition(nutrition);
  };

  // Sincronização agora é feita automaticamente pelo updateNutrition do store

  // Carregar nutrição do dia do backend ao montar usando o store
  const { loadNutrition } = useStudent("loaders");
  
  useEffect(() => {
    // Só carregar se não tiver dados no store
    if (!storeNutrition || storeNutrition.meals.length === 0) {
      setIsLoading(true);
      loadNutrition().finally(() => {
        setIsLoading(false);
      });
    }
  }, [storeNutrition, loadNutrition]);

  const handleMealComplete = async (mealId: string) => {
    toggleMealComplete(mealId);
    // updateNutrition já sincroniza automaticamente com backend
  };

  const handleAddFoodToMeal = (mealId: string) => {
    setSelectedMealId(mealId);
    setShowFoodSearch(true);
  };

  const handleAddFood = async (
    foods: Array<{ food: FoodItem; servings: number }>,
    mealIds: string[]
  ) => {
    if (mealIds.length > 0 && foods.length > 0) {
      // Atualizar o store IMMEDIATAMENTE (optimistic update)
      mealIds.forEach((mealId) => {
        foods.forEach(({ food, servings }) => {
          addFoodToMeal(mealId, food, servings);
        });
      });
      
      // Fechar modal e limpar seleções DEPOIS do update otimista
      // Usar setTimeout para garantir que o render aconteça primeiro
      setTimeout(() => {
        setSelectedMealId(null);
        setShowFoodSearch(false);
      }, 0);
      
      // updateNutrition já sincroniza automaticamente com backend
    }
  };

  const handleToggleWaterGlass = useCallback(
    (index: number) => {
      const glassSize = 250;
      const currentGlasses = Math.floor(dailyNutrition.waterIntake / glassSize);

      // Atualizar estado imediatamente para feedback visual
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
      // updateNutrition já sincroniza automaticamente com backend
    },
    [dailyNutrition.waterIntake, dailyNutrition.targetWater, updateWaterIntake]
  );


  const handleCloseFoodSearch = () => {
    setShowFoodSearch(false);
    setSelectedMealId(null);
  };

  const handleAddMealSubmit = async (mealsData: Parameters<typeof addMeal>[0][]) => {
    mealsData.forEach((mealData) => {
      addMeal(mealData);
    });
    // updateNutrition já sincroniza automaticamente com backend
  };

  const handleRemoveMeal = async (mealId: string) => {
    removeMeal(mealId);
    // updateNutrition já sincroniza automaticamente com backend
  };

  const handleRemoveFoodFromMeal = async (mealId: string, foodId: string) => {
    removeFoodFromMeal(mealId, foodId);
    // updateNutrition já sincroniza automaticamente com backend
  };

  return {
    dailyNutrition,
    selectedMealId,
    showAddMealModal,
    isLoading,
    setSelectedMealId,
    setShowAddMealModal,
    handleMealComplete,
    handleAddFoodToMeal,
    handleAddFood,
    handleToggleWaterGlass,
    handleCloseFoodSearch,
    handleAddMealSubmit,
    removeMeal: handleRemoveMeal,
    removeFoodFromMeal: handleRemoveFoodFromMeal,
  };
}
