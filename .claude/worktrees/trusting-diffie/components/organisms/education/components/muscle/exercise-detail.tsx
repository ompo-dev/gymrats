"use client";

import { ArrowLeft, Dumbbell } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { SectionCard } from "@/components/molecules/cards/section-card";
import type { ExerciseInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ExerciseDetailProps {
	exercise: ExerciseInfo;
	onBack: () => void;
	muscleGroupLabels: Record<string, string>;
	getDifficultyClasses: (difficulty: string) => string;
}

export function ExerciseDetail({
	exercise,
	onBack,
	muscleGroupLabels,
	getDifficultyClasses,
}: ExerciseDetailProps) {
	return (
		<div className="mx-auto max-w-4xl space-y-6  ">
			<FadeIn>
				<button
					onClick={onBack}
					className="mb-4 flex items-center gap-2 font-bold text-duo-green hover:underline"
				>
					<ArrowLeft className="h-5 w-5" />
					Voltar
				</button>
			</FadeIn>

			<SlideIn delay={0.1}>
				<SectionCard
					title={exercise.name}
					icon={Dumbbell}
					variant="highlighted"
				>
					<div className="mb-4 flex flex-wrap gap-2">
						<span
							className={cn(
								"rounded-full px-3 py-1 text-xs font-bold capitalize",
								getDifficultyClasses(exercise.difficulty),
							)}
						>
							{exercise.difficulty}
						</span>
						{exercise.equipment.map((eq, i) => (
							<span
								key={i}
								className="rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-duo-gray-dark"
							>
								{eq}
							</span>
						))}
					</div>
					<div className="space-y-3">
						<div>
							<div className="mb-2 text-xs font-bold text-duo-gray-dark">
								MÚSCULOS PRIMÁRIOS
							</div>
							<div className="flex flex-wrap gap-2">
								{exercise.primaryMuscles.map((m, i) => (
									<span
										key={i}
										className="rounded-lg bg-duo-green/20 px-2 py-1 text-xs font-bold capitalize text-duo-green"
									>
										{muscleGroupLabels[m] || m}
									</span>
								))}
							</div>
						</div>
						{exercise.secondaryMuscles.length > 0 && (
							<div>
								<div className="mb-2 text-xs font-bold text-duo-gray-dark">
									SECUNDÁRIOS
								</div>
								<div className="flex flex-wrap gap-2">
									{exercise.secondaryMuscles.map((m, i) => (
										<span
											key={i}
											className="rounded-lg bg-duo-blue/20 px-2 py-1 text-xs font-bold capitalize text-duo-blue"
										>
											{muscleGroupLabels[m] || m}
										</span>
									))}
								</div>
							</div>
						)}
					</div>
				</SectionCard>
			</SlideIn>

			<SlideIn delay={0.2}>
				<SectionCard title="Como Executar" icon={Dumbbell}>
					<ol className="space-y-3">
						{exercise.instructions.map((instruction, i) => (
							<li key={i} className="flex gap-3">
								<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-duo-blue text-sm font-bold text-white">
									{i + 1}
								</span>
								<span className="pt-1 text-duo-text">{instruction}</span>
							</li>
						))}
					</ol>
				</SectionCard>
			</SlideIn>

			<SlideIn delay={0.3}>
				<DuoCard variant="highlighted" size="default">
					<div className="mb-3 flex items-center gap-2">
						<span className="text-xl">✓</span>
						<h3 className="text-lg font-bold text-duo-text">
							Dicas Importantes
						</h3>
					</div>
					<ul className="space-y-2">
						{exercise.tips.map((tip, i) => (
							<li key={i} className="flex items-start gap-2">
								<span className="text-duo-green">•</span>
								<span className="text-duo-text">{tip}</span>
							</li>
						))}
					</ul>
				</DuoCard>
			</SlideIn>

			<SlideIn delay={0.4}>
				<DuoCard
					variant="default"
					size="default"
					className="border-duo-red bg-duo-red/10"
				>
					<div className="mb-3 flex items-center gap-2">
						<span className="text-xl">⚠️</span>
						<h3 className="text-lg font-bold text-duo-text">Erros Comuns</h3>
					</div>
					<ul className="space-y-2">
						{exercise.commonMistakes.map((mistake, i) => (
							<li key={i} className="flex items-start gap-2">
								<span className="text-duo-red">×</span>
								<span className="text-duo-text">{mistake}</span>
							</li>
						))}
					</ul>
				</DuoCard>
			</SlideIn>

			<SlideIn delay={0.5}>
				<DuoCard variant="yellow" size="default">
					<h3 className="mb-3 text-lg font-bold text-duo-text">Benefícios</h3>
					<ul className="space-y-2">
						{exercise.benefits.map((benefit, i) => (
							<li key={i} className="flex items-start gap-2">
								<span className="text-duo-yellow">+</span>
								<span className="text-duo-text">{benefit}</span>
							</li>
						))}
					</ul>
				</DuoCard>
			</SlideIn>

			{exercise.scientificEvidence && (
				<SlideIn delay={0.6}>
					<DuoCard variant="blue" size="default">
						<div className="mb-3 flex items-center gap-2">
							<span className="text-xl">🔬</span>
							<h3 className="text-lg font-bold text-duo-text">
								Evidência Científica
							</h3>
						</div>
						<p className="leading-relaxed text-duo-text">
							{exercise.scientificEvidence}
						</p>
					</DuoCard>
				</SlideIn>
			)}
		</div>
	);
}
