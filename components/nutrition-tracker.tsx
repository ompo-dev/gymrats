"use client"

import { useState } from "react"
import type { DailyNutrition, Meal } from "@/lib/types"
import { Check, Plus, Droplets } from "lucide-react"
import { cn } from "@/lib/utils"

interface NutritionTrackerProps {
  nutrition: DailyNutrition
  onMealComplete: (mealId: string) => void
  onAddMeal: () => void
}

export function NutritionTracker({ nutrition, onMealComplete, onAddMeal }: NutritionTrackerProps) {
  const [waterGlasses, setWaterGlasses] = useState(Math.floor(nutrition.waterIntake / 250))

  const caloriesProgress = (nutrition.totalCalories / nutrition.targetCalories) * 100
  const proteinProgress = (nutrition.totalProtein / nutrition.targetProtein) * 100
  const carbsProgress = (nutrition.totalCarbs / nutrition.targetCarbs) * 100
  const fatsProgress = (nutrition.totalFats / nutrition.targetFats) * 100
  const waterProgress = (nutrition.waterIntake / nutrition.targetWater) * 100

  const addWaterGlass = () => {
    setWaterGlasses((prev) => Math.min(prev + 1, 12))
  }

  const getMealIcon = (type: string) => {
    const icons: Record<string, string> = {
      breakfast: "🍳",
      lunch: "🍽️",
      dinner: "🌙",
      snack: "🍎",
    }
    return icons[type] || "🍴"
  }

  const getMealTime = (type: string) => {
    const times: Record<string, string> = {
      breakfast: "Café da Manhã",
      lunch: "Almoço",
      dinner: "Jantar",
      snack: "Lanche",
    }
    return times[type] || type
  }

  return (
    <div className="space-y-6">
      {/* Macro overview cards */}
      <div className="grid grid-cols-2 gap-3">
        <MacroCard
          label="Calorias"
          current={nutrition.totalCalories}
          target={nutrition.targetCalories}
          unit="kcal"
          color="bg-duo-orange"
          progress={caloriesProgress}
        />
        <MacroCard
          label="Proteínas"
          current={nutrition.totalProtein}
          target={nutrition.targetProtein}
          unit="g"
          color="bg-duo-red"
          progress={proteinProgress}
        />
        <MacroCard
          label="Carboidratos"
          current={nutrition.totalCarbs}
          target={nutrition.targetCarbs}
          unit="g"
          color="bg-duo-blue"
          progress={carbsProgress}
        />
        <MacroCard
          label="Gorduras"
          current={nutrition.totalFats}
          target={nutrition.targetFats}
          unit="g"
          color="bg-duo-yellow"
          progress={fatsProgress}
        />
      </div>

      {/* Water intake */}
      <div className="rounded-2xl border-2 border-duo-gray-border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-duo-blue" />
            <span className="font-bold text-duo-text">Hidratação</span>
          </div>
          <span className="text-sm font-bold text-duo-gray-dark">
            {nutrition.waterIntake}ml / {nutrition.targetWater}ml
          </span>
        </div>

        <div className="mb-3 h-2 overflow-hidden rounded-full bg-duo-gray-light">
          <div
            className="h-full rounded-full bg-duo-blue transition-all duration-300"
            style={{ width: `${Math.min(waterProgress, 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <button
              key={i}
              onClick={addWaterGlass}
              disabled={i >= waterGlasses}
              className={cn(
                "aspect-square rounded-lg border-2 transition-all",
                i < waterGlasses
                  ? "border-duo-blue bg-duo-blue/20"
                  : "border-duo-gray-border bg-white hover:border-duo-blue/50",
              )}
            >
              <Droplets className={cn("mx-auto h-4 w-4", i < waterGlasses ? "text-duo-blue" : "text-duo-gray-light")} />
            </button>
          ))}
        </div>
      </div>

      {/* Meals list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-duo-text">Refeições de Hoje</h3>
          <button
            onClick={onAddMeal}
            className="flex items-center gap-1 rounded-xl border-2 border-duo-green bg-white px-3 py-1.5 text-sm font-bold text-duo-green transition-all hover:bg-duo-green hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>

        {nutrition.meals.map((meal) => (
          <MealCard key={meal.id} meal={meal} onComplete={() => onMealComplete(meal.id)} />
        ))}
      </div>
    </div>
  )
}

function MacroCard({
  label,
  current,
  target,
  unit,
  color,
  progress,
}: {
  label: string
  current: number
  target: number
  unit: string
  color: string
  progress: number
}) {
  return (
    <div className="rounded-2xl border-2 border-duo-gray-border bg-white p-4">
      <div className="mb-2 text-xs font-bold uppercase text-duo-gray-dark">{label}</div>
      <div className="mb-2 text-2xl font-bold text-duo-text">
        {current}
        <span className="text-base text-duo-gray-dark">/{target}</span>
      </div>
      <div className="mb-1 h-2 overflow-hidden rounded-full bg-duo-gray-light">
        <div
          className={cn("h-full rounded-full transition-all duration-300", color)}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="text-xs font-bold text-duo-gray-dark">{unit}</div>
    </div>
  )
}

function MealCard({ meal, onComplete }: { meal: Meal; onComplete: () => void }) {
  const getMealIcon = (type: string) => {
    const icons: Record<string, string> = {
      breakfast: "🍳",
      lunch: "🍽️",
      dinner: "🌙",
      snack: "🍎",
    }
    return icons[type] || "🍴"
  }

  const getMealTime = (type: string) => {
    const times: Record<string, string> = {
      breakfast: "Café da Manhã",
      lunch: "Almoço",
      dinner: "Jantar",
      snack: "Lanche",
    }
    return times[type] || type
  }

  return (
    <div
      className={cn(
        "rounded-2xl border-2 p-4 transition-all",
        meal.completed ? "border-duo-green bg-duo-green/5" : "border-duo-gray-border bg-white",
      )}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-duo-gray-light text-2xl">
            {getMealIcon(meal.type)}
          </div>
          <div>
            <div className="mb-1 font-bold text-duo-text">{meal.name}</div>
            <div className="text-xs font-bold text-duo-gray-dark">
              {getMealTime(meal.type)} {meal.time && `• ${meal.time}`}
            </div>
          </div>
        </div>
        {!meal.completed && (
          <button
            onClick={onComplete}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-duo-green text-duo-green transition-all hover:bg-duo-green hover:text-white"
          >
            <Check className="h-5 w-5" />
          </button>
        )}
        {meal.completed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-duo-green">
            <Check className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-sm font-bold text-duo-text">{meal.calories}</div>
          <div className="text-xs text-duo-gray-dark">cal</div>
        </div>
        <div>
          <div className="text-sm font-bold text-duo-text">{meal.protein}g</div>
          <div className="text-xs text-duo-gray-dark">prot</div>
        </div>
        <div>
          <div className="text-sm font-bold text-duo-text">{meal.carbs}g</div>
          <div className="text-xs text-duo-gray-dark">carb</div>
        </div>
        <div>
          <div className="text-sm font-bold text-duo-text">{meal.fats}g</div>
          <div className="text-xs text-duo-gray-dark">gord</div>
        </div>
      </div>

      {meal.ingredients && meal.ingredients.length > 0 && (
        <div className="mt-3 border-t border-duo-gray-border pt-3">
          <div className="text-xs font-bold text-duo-gray-dark">{meal.ingredients.join(" • ")}</div>
        </div>
      )}
    </div>
  )
}
