"use client";

import { Apple, ChevronDown, Salad } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DuoCard } from "@/components/duo";
import type { NutritionPreviewMeal } from "@/lib/ai/parsers/nutrition-parser";
import { cn } from "@/lib/utils";

interface NutritionPreviewCardProps {
  meal: NutritionPreviewMeal;
  index: number;
  defaultExpanded?: boolean;
  isStreaming?: boolean;
}

interface FoodPreviewItemCardProps {
  food: NutritionPreviewMeal["foods"][number];
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function FoodPreviewItemCard({
  food,
  index: _index,
  isExpanded,
  onToggle,
}: FoodPreviewItemCardProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full cursor-pointer rounded-xl border p-3 text-left transition-all active:scale-[0.98]",
          isExpanded
            ? "border-duo-green bg-duo-green/10 shadow-sm"
            : "border-duo-border bg-duo-bg-card hover:border-duo-green/50",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Salad className="h-4 w-4 shrink-0 text-duo-green" />
              <div className="truncate font-bold text-duo-fg">{food.name}</div>
            </div>
            <div className="text-xs text-duo-fg-muted">
              {food.servings} porcao{food.servings !== 1 ? "oes" : ""} •{" "}
              {food.servingSize}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-duo-fg-muted">
              <div>{Math.round(food.calories * food.servings)} cal</div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 text-duo-fg-muted"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-3 border-t border-duo-border pt-3 text-xs text-duo-fg-muted">
                P {Math.round(food.protein * food.servings)}g • C{" "}
                {Math.round(food.carbs * food.servings)}g • G{" "}
                {Math.round(food.fats * food.servings)}g
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}

export function NutritionPreviewCard({
  meal,
  index,
  defaultExpanded = false,
  isStreaming = false,
}: NutritionPreviewCardProps) {
  const [userToggled, setUserToggled] = useState(false);
  const [userExpanded, setUserExpanded] = useState(false);
  const [expandedFoodIndex, setExpandedFoodIndex] = useState<number | null>(
    null,
  );
  const isExpanded = userToggled ? userExpanded : defaultExpanded;
  const hasFoods = meal.foods.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <DuoCard.Root
        variant="default"
        className={cn(
          "group transition-colors",
          (hasFoods || isStreaming) &&
            "cursor-pointer hover:border-duo-green/50 active:scale-[0.98]",
        )}
        onClick={
          hasFoods || isStreaming
            ? () => {
                setUserToggled(true);
                setUserExpanded((prev) => !prev);
              }
            : undefined
        }
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-duo-green/10 font-bold text-duo-green">
            {index + 1}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Apple className="h-4 w-4 text-duo-green" />
                  <h4 className="truncate text-lg font-bold text-duo-fg">
                    {meal.name}
                  </h4>
                </div>
                <p className="text-sm text-duo-fg-muted">
                  {meal.foods.length} alimento
                  {meal.foods.length !== 1 ? "s" : ""}
                  {meal.time ? ` • ${meal.time}` : ""}
                </p>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold text-duo-fg">
                  {Math.round(meal.totalCalories)} cal
                </div>
                <div className="text-xs text-duo-fg-muted">
                  P {Math.round(meal.totalProtein)}g • C{" "}
                  {Math.round(meal.totalCarbs)}g • G{" "}
                  {Math.round(meal.totalFats)}g
                </div>
              </div>

              {(hasFoods || isStreaming) && (
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 text-duo-fg-muted"
                >
                  <ChevronDown className="h-5 w-5" />
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (hasFoods || isStreaming) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-2 border-t border-duo-border pt-4">
                {!hasFoods ? (
                  <div className="py-4 text-center text-sm text-duo-fg-muted">
                    Montando alimentos...
                  </div>
                ) : (
                  meal.foods.map((food, foodIndex) => (
                    <FoodPreviewItemCard
                      key={`${meal.type}-${food.name}-${foodIndex}`}
                      food={food}
                      index={foodIndex}
                      isExpanded={expandedFoodIndex === foodIndex}
                      onToggle={() =>
                        setExpandedFoodIndex(
                          expandedFoodIndex === foodIndex ? null : foodIndex,
                        )
                      }
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DuoCard.Root>
    </motion.div>
  );
}
