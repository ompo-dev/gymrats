"use client";

import { Loader, Sparkles, Utensils } from "lucide-react";
import { useState } from "react";
import { generateDietWithAI } from "@/lib/mock-data";
import type { DietPlan } from "@/lib/types";

export function AIDietGenerator() {
	const [isGenerating, setIsGenerating] = useState(false);
	const [generatedDiet, setGeneratedDiet] = useState<DietPlan | null>(null);
	const [preferences, setPreferences] = useState({
		goal: "bulking",
		calories: 2500,
		protein: 180,
		meals: 4,
		restrictions: [] as string[],
	});

	const handleGenerate = async () => {
		setIsGenerating(true);

		const prompt = `Crie um plano de dieta para ${preferences.goal} com ${
			preferences.calories
		} calorias, ${preferences.protein}g de proteína, ${
			preferences.meals
		} refeições. Restrições: ${
			preferences.restrictions.join(", ") || "nenhuma"
		}`;

		const diet = await generateDietWithAI(prompt);
		setGeneratedDiet(diet);
		setIsGenerating(false);
	};

	const goals = [
		{ value: "bulking", label: "Ganho de Massa" },
		{ value: "cutting", label: "Perda de Gordura" },
		{ value: "maintenance", label: "Manutenção" },
	];

	const restrictions = [
		"Vegetariano",
		"Vegano",
		"Sem Lactose",
		"Sem Glúten",
		"Baixo Carboidrato",
	];

	if (isGenerating) {
		return (
			<div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
				<div className="relative">
					<Loader className="h-16 w-16 animate-spin text-duo-green" />
					<Sparkles className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-duo-yellow" />
				</div>
				<div className="text-xl font-bold text-duo-text">
					IA criando sua dieta...
				</div>
				<div className="text-sm text-duo-gray-dark">
					Personalizando refeições para você
				</div>
			</div>
		);
	}

	if (generatedDiet) {
		return (
			<div className="space-y-6">
				<div className="rounded-2xl border-2 border-duo-green bg-linear-to-br from-duo-green/10 to-duo-yellow/10 p-6">
					<div className="mb-4 flex items-start justify-between">
						<div>
							<div className="mb-2 text-2xl font-bold text-duo-text">
								{generatedDiet.title}
							</div>
							<div className="text-sm text-duo-gray-dark">
								{generatedDiet.description}
							</div>
						</div>
						<Sparkles className="h-8 w-8 text-duo-yellow" />
					</div>

					<div className="grid grid-cols-3 gap-4 text-center">
						<div>
							<div className="text-2xl font-bold text-duo-text">
								{generatedDiet.totalCalories}
							</div>
							<div className="text-xs font-bold text-duo-gray-dark">
								calorias
							</div>
						</div>
						<div>
							<div className="text-2xl font-bold text-duo-text">
								{generatedDiet.targetProtein}g
							</div>
							<div className="text-xs font-bold text-duo-gray-dark">
								proteína
							</div>
						</div>
						<div>
							<div className="text-2xl font-bold text-duo-text">
								{generatedDiet.meals.length}
							</div>
							<div className="text-xs font-bold text-duo-gray-dark">
								refeições
							</div>
						</div>
					</div>
				</div>

				<div>
					<h3 className="mb-3 text-lg font-bold text-duo-text">
						Refeições do Dia
					</h3>
					<div className="space-y-3">
						{generatedDiet.meals.map((meal) => (
							<div
								key={meal.id}
								className="rounded-2xl border-2 border-duo-gray-border bg-white p-4"
							>
								<div className="mb-3 flex items-start justify-between">
									<div>
										<div className="mb-1 font-bold text-duo-text">
											{meal.name}
										</div>
										{meal.time && (
											<div className="text-xs font-bold text-duo-gray-dark">
												{meal.time}
											</div>
										)}
									</div>
									<Utensils className="h-5 w-5 text-duo-green" />
								</div>

								<div className="grid grid-cols-4 gap-2 text-center text-sm">
									<div>
										<div className="font-bold text-duo-text">
											{meal.calories}
										</div>
										<div className="text-xs text-duo-gray-dark">cal</div>
									</div>
									<div>
										<div className="font-bold text-duo-text">
											{meal.protein}g
										</div>
										<div className="text-xs text-duo-gray-dark">prot</div>
									</div>
									<div>
										<div className="font-bold text-duo-text">{meal.carbs}g</div>
										<div className="text-xs text-duo-gray-dark">carb</div>
									</div>
									<div>
										<div className="font-bold text-duo-text">{meal.fats}g</div>
										<div className="text-xs text-duo-gray-dark">gord</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2">
					<button
						onClick={() => setGeneratedDiet(null)}
						className="rounded-2xl border-2 border-duo-gray-border bg-white py-3 font-bold text-duo-text transition-all hover:border-duo-gray-dark"
					>
						GERAR OUTRA
					</button>
					<button className="duo-button-green">SALVAR DIETA</button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="text-center">
				<div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-duo-green to-duo-yellow">
					<Sparkles className="h-10 w-10 text-white" />
				</div>
				<h1 className="mb-2 text-3xl font-bold text-duo-text">
					Gerador de Dietas com IA
				</h1>
				<p className="text-sm text-duo-gray-dark">
					Crie planos alimentares personalizados
				</p>
			</div>

			<div className="space-y-4">
				<div>
					<label className="mb-2 block text-sm font-bold text-duo-gray-dark">
						Objetivo
					</label>
					<div className="grid grid-cols-3 gap-2">
						{goals.map((goal) => (
							<button
								key={goal.value}
								onClick={() =>
									setPreferences({ ...preferences, goal: goal.value })
								}
								className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${
									preferences.goal === goal.value
										? "border-duo-green bg-duo-green text-white"
										: "border-duo-gray-border bg-white text-duo-text hover:border-duo-green/50"
								}`}
							>
								{goal.label}
							</button>
						))}
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<label className="mb-2 block text-sm font-bold text-duo-gray-dark">
							Calorias diárias
						</label>
						<input
							type="number"
							value={preferences.calories}
							onChange={(e) =>
								setPreferences({
									...preferences,
									calories: Number.parseInt(e.target.value, 10),
								})
							}
							className="w-full rounded-xl border-2 border-duo-gray-border px-4 py-3 font-bold text-duo-text focus:border-duo-green focus:outline-none"
						/>
					</div>

					<div>
						<label className="mb-2 block text-sm font-bold text-duo-gray-dark">
							Proteína (g)
						</label>
						<input
							type="number"
							value={preferences.protein}
							onChange={(e) =>
								setPreferences({
									...preferences,
									protein: Number.parseInt(e.target.value, 10),
								})
							}
							className="w-full rounded-xl border-2 border-duo-gray-border px-4 py-3 font-bold text-duo-text focus:border-duo-green focus:outline-none"
						/>
					</div>
				</div>

				<div>
					<label className="mb-2 block text-sm font-bold text-duo-gray-dark">
						Número de Refeições
					</label>
					<div className="grid grid-cols-4 gap-2">
						{[3, 4, 5, 6].map((num) => (
							<button
								key={num}
								onClick={() => setPreferences({ ...preferences, meals: num })}
								className={`rounded-xl border-2 py-3 text-lg font-bold transition-all ${
									preferences.meals === num
										? "border-duo-blue bg-duo-blue text-white"
										: "border-duo-gray-border bg-white text-duo-text hover:border-duo-blue/50"
								}`}
							>
								{num}
							</button>
						))}
					</div>
				</div>

				<div>
					<label className="mb-2 block text-sm font-bold text-duo-gray-dark">
						Restrições Alimentares
					</label>
					<div className="grid grid-cols-2 gap-2">
						{restrictions.map((restriction) => (
							<button
								key={restriction}
								onClick={() => {
									const newRestrictions = preferences.restrictions.includes(
										restriction,
									)
										? preferences.restrictions.filter((r) => r !== restriction)
										: [...preferences.restrictions, restriction];
									setPreferences({
										...preferences,
										restrictions: newRestrictions,
									});
								}}
								className={`rounded-xl border-2 py-2 text-sm font-bold transition-all ${
									preferences.restrictions.includes(restriction)
										? "border-duo-yellow bg-duo-yellow/20 text-duo-yellow"
										: "border-duo-gray-border bg-white text-duo-text hover:border-duo-yellow/50"
								}`}
							>
								{restriction}
							</button>
						))}
					</div>
				</div>
			</div>

			<button
				onClick={handleGenerate}
				className="duo-button-green w-full text-lg"
			>
				<Sparkles className="mr-2 h-6 w-6" />
				GERAR DIETA COM IA
			</button>
		</div>
	);
}
