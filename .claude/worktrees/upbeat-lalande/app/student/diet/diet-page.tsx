/**
 * Página de Dieta/Nutrição do Student
 *
 * Arquitetura Offline-First:
 * - Usa apenas dados do store unificado (via useStudent hook)
 * - Não recebe props SSR (dados vêm do store)
 * - Funciona offline com dados em cache
 * - Sincronização automática via syncManager
 * - Dados carregados automaticamente pelo useStudentInitializer no layout
 */

"use client";

import { Calendar, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { StatCardLarge } from "@/components/molecules/cards/stat-card-large";
import { AddMealModal } from "@/components/organisms/modals/add-meal-modal";
import { FoodSearch } from "@/components/organisms/modals/food-search";
import { NutritionTracker } from "@/components/organisms/trackers/nutrition-tracker";
import { useLoadPrioritized } from "@/hooks/use-load-prioritized";
import { useModalState, useModalStateWithParam } from "@/hooks/use-modal-state";
import { useNutritionHandlers } from "@/hooks/use-nutrition-handlers";
import { useStudent } from "@/hooks/use-student";

export function DietPage() {
	// Carregamento prioritizado: dailyNutrition e progress aparecem primeiro
	// Se dados já existem no store, só carrega o que falta
	useLoadPrioritized({ context: "diet" });

	// ============================================
	// DADOS DO STORE UNIFICADO (Offline-First)
	// ============================================
	// Todos os dados vêm do store unificado, que:
	// - É carregado automaticamente pelo useStudentInitializer no layout
	// - Persiste em IndexedDB (funciona offline)
	// - Sincroniza automaticamente via syncManager
	// - Usa rotas específicas otimizadas (3-5x mais rápido)

	const foodDatabase = useStudent("foodDatabase");
	const { loadFoodDatabase } = useStudent("loaders");

	// Modais controlados por search params
	const addMealModal = useModalState("add-meal");
	const foodSearchModal = useModalStateWithParam("food-search", "mealId");

	// Carregar foodDatabase apenas se não estiver no store
	// O useStudentInitializer já carrega a maioria dos dados, mas foodDatabase
	// pode não ser carregado automaticamente (é grande e opcional)
	useEffect(() => {
		if (!foodDatabase || foodDatabase.length === 0) {
			loadFoodDatabase().catch((error) => {
				console.error("[DietPage] Erro ao carregar foodDatabase:", error);
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [foodDatabase, loadFoodDatabase]);
	const {
		dailyNutrition,
		selectedMealId,
		handleMealComplete,
		handleAddFoodToMeal: _handleAddFoodToMeal,
		handleAddFood,
		handleToggleWaterGlass,
		handleAddMealSubmit,
		setSelectedMealId,
		removeMeal,
		removeFoodFromMeal,
	} = useNutritionHandlers();

	// Sincronizar selectedMealId com search param
	useEffect(() => {
		if (selectedMealId && !foodSearchModal.paramValue) {
			foodSearchModal.setParamValue(selectedMealId);
		}
	}, [selectedMealId, foodSearchModal]);

	// Handler para abrir food search com mealId
	const handleOpenFoodSearch = (mealId?: string) => {
		if (mealId) {
			setSelectedMealId(mealId);
			foodSearchModal.open(mealId);
		} else {
			foodSearchModal.open();
		}
	};

	// Handler para fechar food search
	const handleCloseFoodSearch = () => {
		foodSearchModal.close();
		setSelectedMealId(null);
	};

	const completedMeals = dailyNutrition.meals.filter((m) => m.completed).length;
	const totalMeals = dailyNutrition.meals.length;
	const caloriesPercentage = Math.round(
		(dailyNutrition.totalCalories / dailyNutrition.targetCalories) * 100,
	);

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h1 className="mb-2 text-3xl font-bold text-duo-text">Nutrição</h1>
				<p className="text-sm text-duo-gray-dark">
					{completedMeals} de {totalMeals} refeições concluídas hoje
				</p>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<StatCardLarge
					icon={Calendar}
					value={`${completedMeals}/${totalMeals}`}
					label="refeições hoje"
					iconColor="duo-blue"
				/>
				<StatCardLarge
					icon={TrendingUp}
					value={`${caloriesPercentage}%`}
					label="meta calórica"
					iconColor="duo-green"
				/>
			</div>

			<NutritionTracker
				nutrition={dailyNutrition}
				onMealComplete={handleMealComplete}
				onAddMeal={addMealModal.open}
				onAddFoodToMeal={handleOpenFoodSearch}
				onDeleteMeal={removeMeal}
				onDeleteFood={removeFoodFromMeal}
				onToggleWaterGlass={handleToggleWaterGlass}
			/>

			{addMealModal.isOpen && (
				<AddMealModal
					onClose={addMealModal.close}
					onAddMeal={(mealsData) => {
						handleAddMealSubmit(mealsData);
						addMealModal.close();
					}}
				/>
			)}

			{foodSearchModal.isOpen && (
				<FoodSearch
					onAddFood={handleAddFood}
					onAddMeal={handleAddMealSubmit}
					onClose={handleCloseFoodSearch}
					selectedMealId={foodSearchModal.paramValue || selectedMealId}
					meals={dailyNutrition.meals}
					foodDatabase={foodDatabase || []}
					onSelectMeal={(mealId) => {
						setSelectedMealId(mealId);
						foodSearchModal.setParamValue(mealId);
					}}
				/>
			)}
		</div>
	);
}
