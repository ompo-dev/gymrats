import * as React from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DuoCard } from "./duo-card";
import { FoodItemCard } from "./food-item-card";
import { Button } from "@/components/atoms/buttons/button";
import { cn } from "@/lib/utils";
import type { Meal } from "@/lib/types";

export interface MealCardProps extends React.HTMLAttributes<HTMLDivElement> {
  meal: Meal;
  onComplete: () => void;
  onAddFood?: () => void;
  onDelete?: () => void;
  onDeleteFood?: (foodId: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  expandedFoodId?: string | null;
  onToggleFoodExpand?: (foodId: string) => void;
}

const mealIcons: Record<string, string> = {
  breakfast: "🍳",
  lunch: "🍽️",
  dinner: "🌙",
  snack: "🍎",
  "afternoon-snack": "☕",
  "pre-workout": "💪",
  "post-workout": "🏋️",
};

const mealTimes: Record<string, string> = {
  breakfast: "Café da Manhã",
  lunch: "Almoço",
  dinner: "Jantar",
  snack: "Lanche",
  "afternoon-snack": "Café da Tarde",
  "pre-workout": "Pré Treino",
  "post-workout": "Pós Treino",
};

export function MealCard({
  meal,
  onComplete,
  onAddFood,
  onDelete,
  onDeleteFood,
  isExpanded = false,
  onToggleExpand,
  expandedFoodId,
  onToggleFoodExpand,
  className,
  ...props
}: MealCardProps) {
  const getMealIcon = (type: string, name?: string) => {
    // Se o tipo for snack, tenta determinar pelo nome
    if (type === "snack" && name) {
      if (name.includes("Café da Tarde")) return mealIcons["afternoon-snack"];
      if (name.includes("Pré Treino") || name.includes("Pré"))
        return mealIcons["pre-workout"];
      if (name.includes("Pós Treino") || name.includes("Pós"))
        return mealIcons["post-workout"];
    }
    return mealIcons[type] || "🍴";
  };

  const getMealTime = (type: string, name?: string) => {
    // Se o tipo for snack, tenta determinar pelo nome
    if (type === "snack" && name) {
      if (name.includes("Café da Tarde")) return mealTimes["afternoon-snack"];
      if (name.includes("Pré Treino") || name.includes("Pré"))
        return mealTimes["pre-workout"];
      if (name.includes("Pós Treino") || name.includes("Pós"))
        return mealTimes["post-workout"];
    }
    return mealTimes[type] || type;
  };

  const foods = meal.foods || [];
  const hasFoods = foods.length > 0;

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <DuoCard
        variant={meal.completed ? "highlighted" : "default"}
        size="md"
        className={cn(
          meal.completed && "bg-duo-green/5",
          onToggleExpand &&
            "cursor-pointer hover:border-duo-blue transition-all active:scale-[0.98]"
        )}
        onClick={onToggleExpand ? onToggleExpand : undefined}
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex gap-3 flex-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl">
              {getMealIcon(meal.type, meal.name)}
            </div>
            <div className="flex-1">
              <div className="mb-1 font-bold text-duo-text">{meal.name}</div>
              <div className="text-xs font-bold text-duo-gray-dark">
                {meal.time && ` ${meal.time}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onAddFood && (
              <Button
                variant="white"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddFood();
                }}
                title="Adicionar alimento"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            {!meal.completed ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-duo-green text-duo-green transition-all hover:bg-duo-green hover:text-white active:scale-90"
                title="Marcar como completa"
              >
                <Check className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-duo-green transition-all hover:bg-duo-green/90 active:scale-90"
                title="Desmarcar"
              >
                <Check className="h-5 w-5 text-white" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-sm font-bold text-duo-text">
              {meal.calories}
            </div>
            <div className="text-xs text-duo-gray-dark">cal</div>
          </div>
          <div>
            <div className="text-sm font-bold text-duo-text">
              {meal.protein}g
            </div>
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

        {/* Lista de alimentos dentro do card quando expandido */}
        <AnimatePresence>
          {isExpanded && hasFoods && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div
                className="mt-3 space-y-2 border-t border-gray-300 pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <AnimatePresence mode="popLayout">
                  {foods.map((food, index) => (
                    <motion.div
                      key={food.id}
                      layout
                      initial={{ opacity: 0, y: -10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.7,
                        height: 0,
                        y: -10,
                        transition: {
                          duration: 0.25,
                          ease: [0.34, 1.56, 0.64, 1], // Bounce effect
                          height: { duration: 0.2 },
                        },
                      }}
                      transition={{
                        delay: index * 0.05,
                        duration: 0.2,
                        layout: { duration: 0.2 },
                      }}
                    >
                      <FoodItemCard
                        food={food}
                        isExpanded={expandedFoodId === food.id}
                        onToggle={() => onToggleFoodExpand?.(food.id)}
                        onDelete={
                          onDeleteFood ? () => onDeleteFood(food.id) : undefined
                        }
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão de excluir refeição quando expandido */}
        <AnimatePresence>
          {isExpanded && onDelete && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div
                className="mt-3 border-t border-gray-300 pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir Refeição
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DuoCard>
    </div>
  );
}
