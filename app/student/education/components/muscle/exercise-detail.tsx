"use client";

import { ArrowLeft, Dumbbell } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard } from "@/components/duo";
import { DuoCard } from "@/components/duo";
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
					type="button"
					onClick={onBack}
					className="mb-4 flex items-center gap-2 font-bold text-duo-green hover:underline"
				>
					<ArrowLeft className="h-5 w-5" />
					Voltar
				</button>
			</FadeIn>

			<SlideIn delay={0.1}>
				<DuoCard.Root variant="highlighted" padding="md">
					<DuoCard.Header>
						<div className="flex items-center gap-2">
							<Dumbbell className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
							<h2 className="font-bold text-[var(--duo-fg)]">{exercise.name}</h2>
						</div>
					</DuoCard.Header>
					<div className="mb-4 flex flex-wrap gap-2">
						<span
							className={cn(
								"rounded-full px-3 py-1 text-xs font-bold capitalize",
								getDifficultyClasses(exercise.difficulty),
							)}
						>
							{exercise.difficulty}
						</span>
						{exercise.equipment.map((eq) => (
							<span
								key={eq}
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
								{exercise.primaryMuscles.map((m) => (
									<span
										key={m}
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
									{exercise.secondaryMuscles.map((m) => (
										<span
											key={m}
											className="rounded-lg bg-duo-blue/20 px-2 py-1 text-xs font-bold capitalize text-duo-blue"
										>
											{muscleGroupLabels[m] || m}
										</span>
									))}
								</div>
							</div>
						)}
					</div>
				</DuoCard.Root>
			</SlideIn>

			<SlideIn delay={0.2}>
				<DuoCard.Root variant="default" padding="md">
					<DuoCard.Header>
						<div className="flex items-center gap-2">
							<Dumbbell className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
							<h2 className="font-bold text-[var(--duo-fg)]">Como Executar</h2>
						</div>
					</DuoCard.Header>
					<ol className="space-y-3">
						{exercise.instructions.map((instruction) => (
							<li key={instruction} className="flex gap-3">
								<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-duo-blue text-sm font-bold text-white">
									{exercise.instructions.indexOf(instruction) + 1}
								</span>
								<span className="pt-1 text-duo-text">{instruction}</span>
							</li>
						))}
					</ol>
				</DuoCard.Root>
			</SlideIn>

			<SlideIn delay={0.3}>
				<DuoCard.Root variant="highlighted" size="default">
					<div className="mb-3 flex items-center gap-2">
						<span className="text-xl">✓</span>
						<h3 className="text-lg font-bold text-duo-text">
							Dicas Importantes
						</h3>
					</div>
					<ul className="space-y-2">
						{exercise.tips.map((tip) => (
							<li key={tip} className="flex items-start gap-2">
								<span className="text-duo-green">•</span>
								<span className="text-duo-text">{tip}</span>
							</li>
						))}
					</ul>
				</DuoCard.Root>
			</SlideIn>

			<SlideIn delay={0.4}>
				<DuoCard.Root
					variant="default"
					size="default"
					className="border-duo-red bg-duo-red/10"
				>
					<div className="mb-3 flex items-center gap-2">
						<span className="text-xl">⚠️</span>
						<h3 className="text-lg font-bold text-duo-text">Erros Comuns</h3>
					</div>
					<ul className="space-y-2">
						{exercise.commonMistakes.map((mistake) => (
							<li key={mistake} className="flex items-start gap-2">
								<span className="text-duo-red">×</span>
								<span className="text-duo-text">{mistake}</span>
							</li>
						))}
					</ul>
				</DuoCard.Root>
			</SlideIn>

			<SlideIn delay={0.5}>
				<DuoCard.Root variant="yellow" size="default">
					<h3 className="mb-3 text-lg font-bold text-duo-text">Benefícios</h3>
					<ul className="space-y-2">
						{exercise.benefits.map((benefit) => (
							<li key={benefit} className="flex items-start gap-2">
								<span className="text-duo-yellow">+</span>
								<span className="text-duo-text">{benefit}</span>
							</li>
						))}
					</ul>
				</DuoCard.Root>
			</SlideIn>

			{exercise.scientificEvidence && (
				<SlideIn delay={0.6}>
					<DuoCard.Root variant="blue" size="default">
						<div className="mb-3 flex items-center gap-2">
							<span className="text-xl">🔬</span>
							<h3 className="text-lg font-bold text-duo-text">
								Evidência Científica
							</h3>
						</div>
						<p className="leading-relaxed text-duo-text">
							{exercise.scientificEvidence}
						</p>
					</DuoCard.Root>
				</SlideIn>
			)}
		</div>
	);
}
