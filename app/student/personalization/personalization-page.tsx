"use client";

import { Dumbbell, Sparkles, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { SectionCard } from "@/components/molecules/cards/section-card";
import { AIDietGenerator } from "@/components/organisms/generators/ai-diet-generator";
import { AIWorkoutGenerator } from "@/components/organisms/generators/ai-workout-generator";
import { BackButton } from "@/components/organisms/navigation/back-button";

export function PersonalizationPage() {
	const [activeView, setActiveView] = useState<"menu" | "workout" | "diet">(
		"menu",
	);

	if (activeView === "workout") {
		return (
			<div>
				<BackButton onClick={() => setActiveView("menu")} color="duo-blue" />
				<AIWorkoutGenerator />
			</div>
		);
	}

	if (activeView === "diet") {
		return (
			<div>
				<BackButton onClick={() => setActiveView("menu")} color="duo-green" />
				<AIDietGenerator />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="grid gap-4">
				<button
					type="button"
					onClick={() => setActiveView("workout")}
					className="rounded-xl border-2 border-duo-blue bg-duo-blue/10 p-6 text-left transition-all hover:bg-duo-blue/20 active:scale-[0.98]"
				>
					<div className="flex items-center gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-duo-blue">
							<Dumbbell className="h-6 w-6 text-white" />
						</div>
						<div className="flex-1">
							<h3 className="mb-1 text-lg font-bold text-duo-text">
								Gerar Treino com IA
							</h3>
							<p className="text-sm text-duo-gray-dark">
								Crie treinos personalizados baseados em suas preferências e
								objetivos
							</p>
						</div>
					</div>
				</button>

				<button
					type="button"
					onClick={() => setActiveView("diet")}
					className="rounded-xl border-2 border-duo-green bg-duo-green/10 p-6 text-left transition-all hover:bg-duo-green/20 active:scale-[0.98]"
				>
					<div className="flex items-center gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-duo-green">
							<UtensilsCrossed className="h-6 w-6 text-white" />
						</div>
						<div className="flex-1">
							<h3 className="mb-1 text-lg font-bold text-duo-text">
								Gerar Dieta com IA
							</h3>
							<p className="text-sm text-duo-gray-dark">
								Crie planos alimentares ajustados aos seus macros e restrições
							</p>
						</div>
					</div>
				</button>
			</div>

			<SectionCard icon={Sparkles} title="Tecnologia de IA">
				<ul className="space-y-2 text-sm text-duo-gray-dark">
					<li className="flex items-start gap-2">
						<span className="text-duo-green">•</span>
						<span>
							Treinos adaptados ao seu nível e equipamentos disponíveis
						</span>
					</li>
					<li className="flex items-start gap-2">
						<span className="text-duo-green">•</span>
						<span>
							Dietas balanceadas respeitando suas restrições alimentares
						</span>
					</li>
					<li className="flex items-start gap-2">
						<span className="text-duo-green">•</span>
						<span>Ajustes automáticos baseados no seu progresso</span>
					</li>
					<li className="flex items-start gap-2">
						<span className="text-duo-green">•</span>
						<span>Sugestões personalizadas para otimizar resultados</span>
					</li>
				</ul>
			</SectionCard>
		</div>
	);
}
