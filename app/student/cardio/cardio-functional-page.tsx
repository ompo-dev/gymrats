"use client";

import { Heart, Target, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard, DuoStatCard, DuoStatsGrid } from "@/components/duo";
import { BackButton } from "@/components/organisms/navigation/back-button";
import { CardioTracker } from "@/components/organisms/trackers/cardio-tracker";
import { FunctionalWorkout } from "@/components/organisms/workout/functional-workout";
import { cn } from "@/lib/utils";

export function CardioFunctionalPage() {
	const [view, setView] = useState<"menu" | "cardio" | "functional">("menu");

	if (view === "cardio") {
		return (
			<div className="mx-auto max-w-4xl space-y-6  ">
				<FadeIn>
					<BackButton onClick={() => setView("menu")} color="duo-red" />
				</FadeIn>
				<CardioTracker.Simple />
			</div>
		);
	}

	if (view === "functional") {
		return (
			<div className="mx-auto max-w-4xl space-y-6  ">
				<FadeIn>
					<BackButton onClick={() => setView("menu")} color="duo-blue" />
				</FadeIn>
				<FunctionalWorkout.Simple />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl space-y-6  ">
			<FadeIn>
				<div className="text-center">
					<h1 className="mb-2 text-3xl font-bold text-duo-text">
						Cardio e Funcionais
					</h1>
					<p className="text-sm text-duo-gray-dark">
						Melhore sua saúde cardiovascular e funcionalidade
					</p>
				</div>
			</FadeIn>

			<DuoStatsGrid.Root columns={2} className="gap-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, duration: 0.4 }}
				>
					<DuoStatCard.Simple
						icon={Heart}
						value="3x"
						label="cardio esta semana"
						iconColor="var(--duo-danger)"
					/>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15, duration: 0.4 }}
				>
					<DuoStatCard.Simple
						icon={TrendingUp}
						value="850"
						label="kcal queimadas"
						iconColor="var(--duo-secondary)"
					/>
				</motion.div>
			</DuoStatsGrid.Root>

			<SlideIn delay={0.2}>
				<div className="grid gap-4">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2, duration: 0.4 }}
					>
						<DuoCard.Root
							variant="default"
							size="default"
							onClick={() => setView("cardio")}
							className={cn(
								"cursor-pointer transition-all hover:border-duo-red active:scale-[0.98]",
							)}
						>
							<div className="flex items-start gap-4">
								<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-duo-red text-4xl">
									🏃
								</div>
								<div className="flex-1">
									<h3 className="mb-2 text-xl font-bold text-duo-text">
										Treino Cardio
									</h3>
									<p className="mb-3 text-sm text-duo-gray-dark">
										Corrida, ciclismo, natação, remo e mais modalidades com
										tracking de calorias
									</p>
									<div className="flex flex-wrap gap-2">
										<span className="rounded-full bg-duo-red/20 px-3 py-1 text-xs font-bold text-duo-red">
											8 modalidades
										</span>
										<span className="rounded-full bg-duo-orange/20 px-3 py-1 text-xs font-bold text-duo-orange">
											Monitor de FC
										</span>
										<span className="rounded-full bg-duo-yellow/20 px-3 py-1 text-xs font-bold text-duo-text">
											Calorias em tempo real
										</span>
									</div>
								</div>
							</div>
						</DuoCard.Root>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3, duration: 0.4 }}
					>
						<DuoCard.Root
							variant="default"
							size="default"
							onClick={() => setView("functional")}
							className={cn(
								"cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]",
							)}
						>
							<div className="flex items-start gap-4">
								<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-duo-blue text-4xl">
									🤸
								</div>
								<div className="flex-1">
									<h3 className="mb-2 text-xl font-bold text-duo-text">
										Treino Funcional
									</h3>
									<p className="mb-3 text-sm text-duo-gray-dark">
										Exercícios para todas as idades: crianças, adultos e
										terceira idade
									</p>
									<div className="flex flex-wrap gap-2">
										<span className="rounded-full bg-duo-green/20 px-3 py-1 text-xs font-bold text-duo-green">
											Mobilidade
										</span>
										<span className="rounded-full bg-duo-blue/20 px-3 py-1 text-xs font-bold text-duo-blue">
											Equilíbrio
										</span>
										<span className="rounded-full bg-duo-orange/20 px-3 py-1 text-xs font-bold text-duo-orange">
											Coordenação
										</span>
									</div>
								</div>
							</div>
						</DuoCard.Root>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4, duration: 0.4 }}
					>
						<DuoCard.Root variant="yellow" padding="md">
							<DuoCard.Header>
								<div className="flex items-center gap-2">
									<Target className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
									<h2 className="font-bold text-[var(--duo-fg)]">Cálculo Personalizado</h2>
								</div>
							</DuoCard.Header>
							<p className="text-sm text-duo-gray-dark">
								As calorias são calculadas baseadas no seu peso, idade, gênero e
								perfil hormonal para máxima precisão
							</p>
						</DuoCard.Root>
					</motion.div>
				</div>
			</SlideIn>
		</div>
	);
}
