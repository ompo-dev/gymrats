"use client"

import { NutritionTracker } from "./nutrition-tracker"
import { FoodSearch } from "./food-search"
import type { FoodItem } from "@/lib/types"
import { Calendar, TrendingUp } from "lucide-react"
import { useNutritionStore, useUIStore } from "@/stores"

export function DietPage() {
  const { dailyNutrition, toggleMealComplete, addFoodToMeal } = useNutritionStore()
  const { showFoodSearch, setShowFoodSearch } = useUIStore()

  const handleMealComplete = (mealId: string) => {
    toggleMealComplete(mealId)
  }

  const handleAddFood = (food: FoodItem, servings: number) => {
    // TODO: Implementar seleção de refeição
    console.log("[v0] Adding food:", food, "servings:", servings)
  }

  const completedMeals = dailyNutrition.meals.filter((m) => m.completed).length
  const totalMeals = dailyNutrition.meals.length

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-duo-text">Nutrição</h1>
        <p className="text-sm text-duo-gray-dark">
          {completedMeals} de {totalMeals} refeições concluídas hoje
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border-2 border-duo-blue bg-gradient-to-br from-duo-blue/10 to-duo-green/10 p-4 text-center">
          <Calendar className="mx-auto mb-2 h-8 w-8 text-duo-blue" />
          <div className="mb-1 text-xl font-bold text-duo-text">
            {completedMeals}/{totalMeals}
          </div>
          <div className="text-xs font-bold text-duo-gray-dark">refeições hoje</div>
        </div>

        <div className="rounded-2xl border-2 border-duo-green bg-gradient-to-br from-duo-green/10 to-duo-yellow/10 p-4 text-center">
          <TrendingUp className="mx-auto mb-2 h-8 w-8 text-duo-green" />
          <div className="mb-1 text-xl font-bold text-duo-text">
            {Math.round((dailyNutrition.totalCalories / dailyNutrition.targetCalories) * 100)}%
          </div>
          <div className="text-xs font-bold text-duo-gray-dark">meta calórica</div>
        </div>
      </div>

      <NutritionTracker
        nutrition={dailyNutrition}
        onMealComplete={handleMealComplete}
        onAddMeal={() => setShowFoodSearch(true)}
      />

      {showFoodSearch && <FoodSearch onAddFood={handleAddFood} onClose={() => setShowFoodSearch(false)} />}
    </div>
  )
}
