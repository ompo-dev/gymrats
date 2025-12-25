"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
    setDailyNutrition,
  } = useNutritionStore();
  const { setShowFoodSearch } = useUIStore();
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const waterSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função para sincronizar com backend
  const syncToBackend = async () => {
    try {
      // Obter estado atualizado do store (usando getState do Zustand)
      const store = useNutritionStore.getState();
      const currentNutrition = store.dailyNutrition;
      
      const response = await fetch("/api/nutrition/daily", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: currentNutrition.date,
          meals: currentNutrition.meals.map((meal, index) => ({
            name: meal.name,
            type: meal.type,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
            time: meal.time,
            completed: meal.completed,
            order: index,
            foods: meal.foods?.map((food) => ({
              foodId: food.foodId,
              foodName: food.foodName,
              servings: food.servings,
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fats: food.fats,
              servingSize: food.servingSize,
            })) || [],
          })),
          waterIntake: currentNutrition.waterIntake,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Se a migration não foi aplicada, não mostrar erro (já está tratado no backend)
        if (errorData.code === "MIGRATION_REQUIRED") {
          console.log(
            "⚠️ Tabela de nutrição não existe. Execute: node scripts/apply-nutrition-migration.js"
          );
          return; // Não tentar sincronizar se a migration não foi aplicada
        }
        console.error("Erro ao sincronizar nutrição:", errorData);
      }
    } catch (error) {
      // Ignorar erros de rede quando a migration não existe
      if (
        error instanceof Error &&
        error.message.includes("MIGRATION_REQUIRED")
      ) {
        return;
      }
      console.error("Erro ao sincronizar nutrição:", error);
    }
  };

  // Carregar nutrição do dia do backend ao montar
  useEffect(() => {
    const loadDailyNutrition = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/nutrition/daily");
        if (response.ok) {
          const data = await response.json();
          setDailyNutrition(data);
        } else {
          // Se a migration não foi aplicada, não mostrar erro
          const errorData = await response.json().catch(() => ({}));
          if (errorData.code !== "MIGRATION_REQUIRED") {
            console.error("Erro ao carregar nutrição:", errorData);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar nutrição:", error);
        // Continuar com dados do store local
      } finally {
        setIsLoading(false);
      }
    };

    loadDailyNutrition();
  }, [setDailyNutrition]);

  const handleMealComplete = async (mealId: string) => {
    toggleMealComplete(mealId);
    // Sincronizar com backend
    await syncToBackend();
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
      
      // Sincronizar com backend em background (não bloquear UI)
      syncToBackend().catch((error) => {
        console.error("Erro ao sincronizar nutrição:", error);
        // Em caso de erro, os dados já estão no store local (optimistic update)
      });
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

      // Cancelar sincronização anterior se existir
      if (waterSyncTimeoutRef.current) {
        clearTimeout(waterSyncTimeoutRef.current);
      }

      // Agendar sincronização com backend após 500ms de inatividade
      waterSyncTimeoutRef.current = setTimeout(() => {
        syncToBackend();
        waterSyncTimeoutRef.current = null;
      }, 500);
    },
    [dailyNutrition.waterIntake, dailyNutrition.targetWater, updateWaterIntake, syncToBackend]
  );

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (waterSyncTimeoutRef.current) {
        clearTimeout(waterSyncTimeoutRef.current);
      }
    };
  }, []);

  const handleCloseFoodSearch = () => {
    setShowFoodSearch(false);
    setSelectedMealId(null);
  };

  const handleAddMealSubmit = async (mealsData: Parameters<typeof addMeal>[0][]) => {
    mealsData.forEach((mealData) => {
      addMeal(mealData);
    });
    // Sincronizar com backend
    await syncToBackend();
  };

  const handleRemoveMeal = async (mealId: string) => {
    removeMeal(mealId);
    // Sincronizar com backend
    await syncToBackend();
  };

  const handleRemoveFoodFromMeal = async (mealId: string, foodId: string) => {
    removeFoodFromMeal(mealId, foodId);
    // Sincronizar com backend
    await syncToBackend();
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
