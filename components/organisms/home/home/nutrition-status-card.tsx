"use client";

import { ArrowRight, Droplets, Plus, UtensilsCrossed } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/atoms/buttons/button";
import { SectionCard } from "@/components/molecules/cards/section-card";
import { useStudent } from "@/hooks/use-student";
import type { DailyNutrition } from "@/lib/types";

interface NutritionStatusCardProps {
	dailyNutrition: DailyNutrition | null | undefined;
}

export function NutritionStatusCard({
	dailyNutrition,
}: NutritionStatusCardProps) {
	const router = useRouter();

	// Verificar se é premium/trial
	const subscription = useStudent("subscription");
	const isPremium = useMemo(() => {
		if (!subscription) return false;

		const now = new Date();
		const isTrialActive =
			subscription.trialEnd && new Date(subscription.trialEnd) > now;
		const isActive = subscription.status === "active";
		const isTrialing = subscription.status === "trialing";

		return (
			subscription.plan === "premium" &&
			(isActive || isTrialing || isTrialActive)
		);
	}, [subscription]);

	// Handler para navegação: se premium, abre chat; senão, redireciona para dieta
	const handleNavigate = () => {
		if (isPremium) {
			// Premium: abrir chat diretamente
			router.push("/student?tab=diet&modal=food-search");
		} else {
			// Não premium: redirecionar para página de dieta (comportamento original)
			router.push("/student?tab=diet");
		}
	};

	// Se não houver dailyNutrition, mostrar empty state
	if (!dailyNutrition) {
		return (
			<SectionCard icon={UtensilsCrossed} title="Nutrição de Hoje">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15, type: "spring" }}
					className="flex flex-col items-center justify-center space-y-4 py-6 text-center"
				>
					<UtensilsCrossed className="h-10 w-10 text-duo-green" />
					<p className="text-base font-bold text-gray-900">
						Comece a registrar!
					</p>
					<p className="text-sm text-gray-600">
						Registre suas refeições e hidratação para acompanhar seu progresso.
					</p>
					<Button onClick={handleNavigate} variant="default" className="w-fit">
						<Plus className="h-4 w-4 mr-2" />
						{isPremium ? "Abrir Chat IA" : "Ir para Nutrição"}
						<ArrowRight className="h-4 w-4 ml-2" />
					</Button>
				</motion.div>
			</SectionCard>
		);
	}

	const hasMeals = dailyNutrition.meals.length > 0;
	const hasWater = dailyNutrition.waterIntake > 0;
	const completedMeals = dailyNutrition.meals.filter((m) => m.completed).length;
	const totalMeals = dailyNutrition.meals.length;
	const caloriesProgress = Math.round(
		(dailyNutrition.totalCalories / dailyNutrition.targetCalories) * 100,
	);
	const waterProgress = Math.round(
		(dailyNutrition.waterIntake / dailyNutrition.targetWater) * 100,
	);

	// Se não tem nada registrado
	if (!hasMeals && !hasWater) {
		return (
			<SectionCard icon={UtensilsCrossed} title="Nutrição de Hoje">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15, type: "spring" }}
					className="flex flex-col items-center justify-center space-y-4 py-6 text-center"
				>
					<UtensilsCrossed className="h-10 w-10 text-duo-green" />
					<p className="text-base font-bold text-gray-900">
						Comece a registrar!
					</p>
					<p className="text-sm text-gray-600">
						Registre suas refeições e hidratação para acompanhar seu progresso.
					</p>
					<Button onClick={handleNavigate} variant="default" className="w-fit">
						<Plus className="h-4 w-4 mr-2" />
						{isPremium ? "Abrir Chat IA" : "Ir para Nutrição"}
						<ArrowRight className="h-4 w-4 ml-2" />
					</Button>
				</motion.div>
			</SectionCard>
		);
	}

	// Se tem dados, mostrar status rápido
	return (
		<SectionCard icon={UtensilsCrossed} title="Nutrição de Hoje">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.15, type: "spring" }}
				className="space-y-4"
			>
				{/* Status de Refeições */}
				<div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-duo-green/10">
							<UtensilsCrossed className="h-5 w-5 text-duo-green" />
						</div>
						<div>
							<p className="text-sm font-bold text-gray-900">
								{completedMeals}/{totalMeals} refeições
							</p>
							<p className="text-xs text-gray-600">
								{caloriesProgress}% da meta calórica
							</p>
						</div>
					</div>
					{hasMeals && (
						<Button onClick={handleNavigate} variant="white" size="sm">
							{isPremium ? "Chat" : "Ver"}
						</Button>
					)}
				</div>

				{/* Status de Hidratação */}
				<div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-duo-blue/10">
							<Droplets className="h-5 w-5 text-duo-blue" />
						</div>
						<div>
							<p className="text-sm font-bold text-gray-900">
								{dailyNutrition.waterIntake}ml
							</p>
							<p className="text-xs text-gray-600">
								{waterProgress}% da meta diária
							</p>
						</div>
					</div>
					{hasWater && (
						<Button onClick={handleNavigate} variant="white" size="sm">
							{isPremium ? "Chat" : "Ver"}
						</Button>
					)}
				</div>

				{/* CTA para adicionar mais */}
				<Button onClick={handleNavigate} variant="default" className="w-full">
					<Plus className="h-4 w-4 mr-2" />
					{isPremium
						? "Abrir Chat IA de Nutrição"
						: "Adicionar Refeição ou Água"}
				</Button>
			</motion.div>
		</SectionCard>
	);
}
