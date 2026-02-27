"use client";

import {
  Beef,
  Droplets,
  Flame,
  Plus,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { DuoButton } from "@/components/duo";
import {
  DuoAchievementCard,
  DuoCard,
  DuoStatsGrid,
} from "@/components/duo";
import { MealCard } from "@/components/molecules/cards/meal-card";
import { WaterIntakeCard } from "@/components/molecules/cards/water-intake-card";
import type { DailyNutrition } from "@/lib/types";

interface NutritionTrackerProps {
  nutrition: DailyNutrition;
  onMealComplete: (mealId: string) => void;
  onAddMeal: () => void;
  onAddFoodToMeal?: (mealId: string) => void;
  onDeleteMeal?: (mealId: string) => void;
  onDeleteFood?: (mealId: string, foodId: string) => void;
  onToggleWaterGlass?: (index: number) => void;
  /** Modo somente leitura: oculta botões de adicionar/editar/excluir */
  readOnly?: boolean;
}

export function NutritionTracker({
  nutrition,
  onMealComplete,
  onAddMeal,
  onAddFoodToMeal,
  onDeleteMeal,
  onDeleteFood,
  onToggleWaterGlass,
  readOnly = false,
}: NutritionTrackerProps) {
  const [expandedFoodId, setExpandedFoodId] = useState<string | null>(null);

  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

  const handleToggleMeal = (mealId: string) => {
    if (expandedMealId === mealId) {
      setExpandedMealId(null);
      setExpandedFoodId(null); // Fecha alimento também
    } else {
      setExpandedMealId(mealId);
      setExpandedFoodId(null); // Fecha alimento anterior se houver
    }
  };

  const handleToggleFood = (foodId: string) => {
    if (expandedFoodId === foodId) {
      setExpandedFoodId(null);
    } else {
      setExpandedFoodId(foodId);
    }
  };

  const waterGlasses = useMemo(
    () => Math.floor(nutrition.waterIntake / 250),
    [nutrition.waterIntake],
  );

  const handleToggleWaterGlass = (index: number) => {
    if (!readOnly && onToggleWaterGlass) {
      onToggleWaterGlass(index);
    }
  };

  return (
    <div className="space-y-6">
      <DuoStatsGrid columns={2} className="gap-3">
        <DuoAchievementCard
          icon={Flame}
          iconColor="var(--duo-accent)"
          title="Calorias"
          description="kcal"
          current={nutrition.totalCalories}
          total={nutrition.targetCalories}
        />
        <DuoAchievementCard
          icon={Beef}
          iconColor="var(--duo-danger)"
          title="Proteínas"
          description="g"
          current={nutrition.totalProtein}
          total={nutrition.targetProtein}
        />
        <DuoAchievementCard
          icon={Wheat}
          iconColor="var(--duo-secondary)"
          title="Carboidratos"
          description="g"
          current={nutrition.totalCarbs}
          total={nutrition.targetCarbs}
        />
        <DuoAchievementCard
          icon={Droplets}
          iconColor="var(--duo-warning)"
          title="Gorduras"
          description="g"
          current={nutrition.totalFats}
          total={nutrition.targetFats}
        />
      </DuoStatsGrid>

      {nutrition.waterIntake === 0 ? (
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 shrink-0 text-[var(--duo-secondary)]" />
              <h2 className="font-bold text-[var(--duo-fg)]">Hidratação</h2>
            </div>
            <span className="text-sm font-bold text-[var(--duo-fg-muted)]">
              {nutrition.waterIntake}ml / {nutrition.targetWater}ml
            </span>
          </DuoCard.Header>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="flex flex-col items-center justify-center space-y-4 py-8 text-center"
          >
            <Droplets className="h-12 w-12 text-duo-blue" />
            <p className="text-lg font-bold text-[var(--duo-fg)]">Hidrate-se!</p>
            <p className="text-sm text-[var(--duo-fg-muted)]">
              A água é essencial para seu desempenho e recuperação. Comece
              registrando seu primeiro copo de água.
            </p>
            {!readOnly && (
              <DuoButton
                onClick={() => handleToggleWaterGlass(0)}
                variant="primary"
                className="w-fit"
              >
                <Droplets className="h-4 w-4 mr-2" />
                Registrar Copo
              </DuoButton>
            )}
          </motion.div>
        </DuoCard.Root>
      ) : (
        <WaterIntakeCard
          current={nutrition.waterIntake}
          target={nutrition.targetWater}
          glasses={waterGlasses}
          onToggleGlass={handleToggleWaterGlass}
          readOnly={readOnly}
        />
      )}

      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 shrink-0 text-[var(--duo-secondary)]" />
            <h2 className="font-bold text-[var(--duo-fg)]">
              Refeições de Hoje
            </h2>
          </div>
          {!readOnly && (
            <DuoButton variant="white" size="sm" onClick={onAddMeal}>
              <Plus className="h-4 w-4" />
              Adicionar
            </DuoButton>
          )}
        </DuoCard.Header>
        {nutrition.meals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex flex-col items-center justify-center space-y-4 py-8 text-center"
          >
            <UtensilsCrossed className="h-12 w-12 text-duo-green" />
            <p className="text-lg font-bold text-[var(--duo-fg)]">
              Comece a registrar suas refeições!
            </p>
            <p className="text-sm text-[var(--duo-fg-muted)]">
              Acompanhe sua nutrição diária para alcançar seus objetivos.
              Adicione sua primeira refeição e veja sua evolução.
            </p>
            {!readOnly && (
              <DuoButton onClick={onAddMeal} variant="primary" className="w-fit">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Refeição
              </DuoButton>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {nutrition.meals.map((meal) => {
                const _hasFoods = meal.foods && meal.foods.length > 0;
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
                      onAddFood={
                        !readOnly && onAddFoodToMeal
                          ? () => onAddFoodToMeal(meal.id)
                          : undefined
                      }
                      onDelete={
                        !readOnly && onDeleteMeal
                          ? () => onDeleteMeal(meal.id)
                          : undefined
                      }
                      onDeleteFood={
                        !readOnly && onDeleteFood
                          ? (foodId: string) => onDeleteFood(meal.id, foodId)
                          : undefined
                      }
                      isExpanded={expandedMealId === meal.id}
                      onToggleExpand={() => handleToggleMeal(meal.id)}
                      expandedFoodId={expandedFoodId}
                      onToggleFoodExpand={handleToggleFood}
                      readOnly={readOnly}
                    />
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </DuoCard.Root>
    </div>
  );
}
