"use client"

import { useState, useMemo } from "react"
import type { DailyNutrition } from "@/lib/types"
import { Plus } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { MacroCard } from "@/components/ui/macro-card"
import { MealCard } from "@/components/ui/meal-card"
import { WaterIntakeCard } from "@/components/ui/water-intake-card"
import { SectionCard } from "@/components/ui/section-card"
import { Button } from "@/components/ui/button"

interface NutritionTrackerProps {
  nutrition: DailyNutrition
  onMealComplete: (mealId: string) => void
  onAddMeal: () => void
  onAddFoodToMeal?: (mealId: string) => void
  onDeleteMeal?: (mealId: string) => void
  onDeleteFood?: (mealId: string, foodId: string) => void
  onToggleWaterGlass?: (index: number) => void
}

export function NutritionTracker({
  nutrition,
  onMealComplete,
  onAddMeal,
  onAddFoodToMeal,
  onDeleteMeal,
  onDeleteFood,
  onToggleWaterGlass,
}: NutritionTrackerProps) {
  const [expandedFoodId, setExpandedFoodId] = useState<string | null>(null)

  const [expandedMealId, setExpandedMealId] = useState<string | null>(null)

  const handleToggleMeal = (mealId: string) => {
    if (expandedMealId === mealId) {
      setExpandedMealId(null)
      setExpandedFoodId(null) // Fecha alimento também
    } else {
      setExpandedMealId(mealId)
      setExpandedFoodId(null) // Fecha alimento anterior se houver
    }
  }

  const handleToggleFood = (foodId: string) => {
    if (expandedFoodId === foodId) {
      setExpandedFoodId(null)
    } else {
      setExpandedFoodId(foodId)
    }
  }

  const waterGlasses = useMemo(
    () => Math.floor(nutrition.waterIntake / 250),
    [nutrition.waterIntake]
  )

  // Progresso calculado automaticamente baseado nos totais de TODAS as refeições
  // Os totais são atualizados automaticamente quando alimentos são adicionados
  const caloriesProgress = (nutrition.totalCalories / nutrition.targetCalories) * 100
  const proteinProgress = (nutrition.totalProtein / nutrition.targetProtein) * 100
  const carbsProgress = (nutrition.totalCarbs / nutrition.targetCarbs) * 100
  const fatsProgress = (nutrition.totalFats / nutrition.targetFats) * 100

  const handleToggleWaterGlass = (index: number) => {
    if (onToggleWaterGlass) {
      onToggleWaterGlass(index)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <MacroCard
          label="Calorias"
          current={nutrition.totalCalories}
          target={nutrition.targetCalories}
          unit="kcal"
          color="duo-orange"
          progress={caloriesProgress}
        />
        <MacroCard
          label="Proteínas"
          current={nutrition.totalProtein}
          target={nutrition.targetProtein}
          unit="g"
          color="duo-red"
          progress={proteinProgress}
        />
        <MacroCard
          label="Carboidratos"
          current={nutrition.totalCarbs}
          target={nutrition.targetCarbs}
          unit="g"
          color="duo-blue"
          progress={carbsProgress}
        />
        <MacroCard
          label="Gorduras"
          current={nutrition.totalFats}
          target={nutrition.targetFats}
          unit="g"
          color="duo-yellow"
          progress={fatsProgress}
        />
      </div>

      <WaterIntakeCard
        current={nutrition.waterIntake}
        target={nutrition.targetWater}
        glasses={waterGlasses}
        onToggleGlass={handleToggleWaterGlass}
      />

      <SectionCard
        title="Refeições de Hoje"
        headerAction={
          <Button variant="white" size="sm" onClick={onAddMeal}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        }
      >
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
          {nutrition.meals.map((meal) => {
            const hasFoods = meal.foods && meal.foods.length > 0
            return (
              <motion.div
                key={meal.id}
                layout
                initial={{ opacity: 1, scale: 1, height: "auto" }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  height: 0,
                  transition: {
                    duration: 0.3,
                    ease: [0.34, 1.56, 0.64, 1], // Bounce effect
                    height: { duration: 0.25 },
                  },
                }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <MealCard
                  meal={meal}
                  onComplete={() => onMealComplete(meal.id)}
                  onAddFood={onAddFoodToMeal ? () => onAddFoodToMeal(meal.id) : undefined}
                  onDelete={onDeleteMeal ? () => onDeleteMeal(meal.id) : undefined}
                  onDeleteFood={onDeleteFood ? (foodId: string) => onDeleteFood(meal.id, foodId) : undefined}
                  isExpanded={expandedMealId === meal.id}
                  onToggleExpand={() => handleToggleMeal(meal.id)}
                  expandedFoodId={expandedFoodId}
                  onToggleFoodExpand={handleToggleFood}
                />
              </motion.div>
            )
          })}
          </div>
        </AnimatePresence>
      </SectionCard>
    </div>
  )
}
