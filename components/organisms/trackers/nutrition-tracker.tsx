"use client";

import { Droplets, Plus, UtensilsCrossed } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/atoms/buttons/button";
import { MacroCard } from "@/components/molecules/cards/macro-card";
import { MealCard } from "@/components/molecules/cards/meal-card";
import { SectionCard } from "@/components/molecules/cards/section-card";
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

	// Progresso calculado baseado nos totais de refeições COMPLETADAS (com check)
	// Os totais são atualizados automaticamente quando refeições são marcadas como completadas
	const caloriesProgress =
		(nutrition.totalCalories / nutrition.targetCalories) * 100;
	const proteinProgress =
		(nutrition.totalProtein / nutrition.targetProtein) * 100;
	const carbsProgress = (nutrition.totalCarbs / nutrition.targetCarbs) * 100;
	const fatsProgress = (nutrition.totalFats / nutrition.targetFats) * 100;

	const handleToggleWaterGlass = (index: number) => {
		if (onToggleWaterGlass) {
			onToggleWaterGlass(index);
		}
	};

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

			{nutrition.waterIntake === 0 ? (
				<SectionCard
					icon={Droplets}
					title="Hidratação"
					headerAction={
						<span className="text-sm font-bold text-duo-gray-dark">
							{nutrition.waterIntake}ml / {nutrition.targetWater}ml
						</span>
					}
				>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1, type: "spring" }}
						className="flex flex-col items-center justify-center space-y-4 py-8 text-center"
					>
						<Droplets className="h-12 w-12 text-duo-blue" />
						<p className="text-lg font-bold text-gray-900">Hidrate-se!</p>
						<p className="text-sm text-gray-600">
							A água é essencial para seu desempenho e recuperação. Comece
							registrando seu primeiro copo de água.
						</p>
						<Button
							onClick={() => handleToggleWaterGlass(0)}
							variant="default"
							className="w-fit"
						>
							<Droplets className="h-4 w-4 mr-2" />
							Registrar Primeiro Copo
						</Button>
					</motion.div>
				</SectionCard>
			) : (
				<WaterIntakeCard
					current={nutrition.waterIntake}
					target={nutrition.targetWater}
					glasses={waterGlasses}
					onToggleGlass={handleToggleWaterGlass}
				/>
			)}

			<SectionCard
				icon={UtensilsCrossed}
				title="Refeições de Hoje"
				headerAction={
					<Button variant="white" size="sm" onClick={onAddMeal}>
						<Plus className="h-4 w-4" />
						Adicionar
					</Button>
				}
			>
				{nutrition.meals.length === 0 ? (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2, type: "spring" }}
						className="flex flex-col items-center justify-center space-y-4 py-8 text-center"
					>
						<UtensilsCrossed className="h-12 w-12 text-duo-green" />
						<p className="text-lg font-bold text-gray-900">
							Comece a registrar suas refeições!
						</p>
						<p className="text-sm text-gray-600">
							Acompanhe sua nutrição diária para alcançar seus objetivos.
							Adicione sua primeira refeição e veja sua evolução.
						</p>
						<Button onClick={onAddMeal} variant="default" className="w-fit">
							<Plus className="h-4 w-4 mr-2" />
							Adicionar Primeira Refeição
						</Button>
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
												onAddFoodToMeal
													? () => onAddFoodToMeal(meal.id)
													: undefined
											}
											onDelete={
												onDeleteMeal ? () => onDeleteMeal(meal.id) : undefined
											}
											onDeleteFood={
												onDeleteFood
													? (foodId: string) => onDeleteFood(meal.id, foodId)
													: undefined
											}
											isExpanded={expandedMealId === meal.id}
											onToggleExpand={() => handleToggleMeal(meal.id)}
											expandedFoodId={expandedFoodId}
											onToggleFoodExpand={handleToggleFood}
										/>
									</motion.div>
								);
							})}
						</div>
					</AnimatePresence>
				)}
			</SectionCard>
		</div>
	);
}
