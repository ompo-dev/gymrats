"use client";

import { Droplets, Plus, UtensilsCrossed } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/atoms/buttons/button";
import { DuoCard, DuoStatsGrid } from "@/components/duo";
import { MealCard } from "@/components/molecules/cards/meal-card";
import { DuoSectionCard } from "@/components/duo";
import { WaterIntakeCard } from "@/components/molecules/cards/water-intake-card";
import type { DailyNutrition } from "@/lib/types";

function MacroCardContent({
	label,
	current,
	target,
	unit,
	progress,
	progressColor,
}: {
	label: string;
	current: number;
	target: number;
	unit: string;
	progress: number;
	progressColor: string;
}) {
	const displayCurrent =
		unit === "kcal" ? Math.round(current) : Math.round(current * 10) / 10;
	const hasExcess = current > target;
	const excess = hasExcess
		? unit === "kcal"
			? Math.round(current - target)
			: Math.round((current - target) * 10) / 10
		: 0;

	return (
		<DuoCard variant="default" padding="sm">
			<div className="mb-2 text-xs font-bold uppercase text-[var(--duo-fg-muted)]">
				{label}
			</div>
			<div className="mb-2 flex items-center justify-between text-2xl font-bold text-[var(--duo-fg)]">
				<span>
					{displayCurrent}
					<span className="text-base text-[var(--duo-fg-muted)]">/{target}</span>
				</span>
				{hasExcess && (
					<span className="text-sm font-bold text-[var(--duo-danger)]">
						+{excess} {unit}
					</span>
				)}
			</div>
			<div className="mb-1 h-2 overflow-hidden rounded-full bg-gray-200">
				<div
					className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
					style={{ width: `${Math.min(progress, 100)}%` }}
				/>
			</div>
			<div className="text-xs font-bold text-[var(--duo-fg-muted)]">{unit}</div>
		</DuoCard>
	);
}

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
			<DuoStatsGrid columns={2} className="gap-3">
				<MacroCardContent
					label="Calorias"
					current={nutrition.totalCalories}
					target={nutrition.targetCalories}
					unit="kcal"
					progress={caloriesProgress}
					progressColor="bg-[var(--duo-accent)]"
				/>
				<MacroCardContent
					label="Proteínas"
					current={nutrition.totalProtein}
					target={nutrition.targetProtein}
					unit="g"
					progress={proteinProgress}
					progressColor="bg-[var(--duo-danger)]"
				/>
				<MacroCardContent
					label="Carboidratos"
					current={nutrition.totalCarbs}
					target={nutrition.targetCarbs}
					unit="g"
					progress={carbsProgress}
					progressColor="bg-[var(--duo-secondary)]"
				/>
				<MacroCardContent
					label="Gorduras"
					current={nutrition.totalFats}
					target={nutrition.targetFats}
					unit="g"
					progress={fatsProgress}
					progressColor="bg-[var(--duo-warning)]"
				/>
			</DuoStatsGrid>

			{nutrition.waterIntake === 0 ? (
				<DuoSectionCard
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
				</DuoSectionCard>
			) : (
				<WaterIntakeCard
					current={nutrition.waterIntake}
					target={nutrition.targetWater}
					glasses={waterGlasses}
					onToggleGlass={handleToggleWaterGlass}
				/>
			)}

			<DuoSectionCard
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
			</DuoSectionCard>
		</div>
	);
}
