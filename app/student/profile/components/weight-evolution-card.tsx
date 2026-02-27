"use client";

import { Edit, Target, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { DuoButton, DuoCard } from "@/components/duo";
import type { WeightHistoryItem } from "@/lib/types/student-unified";

export interface WeightEvolutionCardProps {
	weightHistory: WeightHistoryItem[];
	weightGain: number | null;
	hasWeightLossGoal: boolean;
	onOpenWeightModal: () => void;
}

export function WeightEvolutionCard({
	weightHistory,
	weightGain,
	hasWeightLossGoal,
	onOpenWeightModal,
}: WeightEvolutionCardProps) {
	return (
		<DuoCard.Root variant="default" padding="md">
			<DuoCard.Header>
				<div className="flex items-center gap-2">
					<TrendingUp
						className="h-5 w-5 shrink-0"
						style={{ color: "var(--duo-secondary)" }}
						aria-hidden
					/>
					<h2 className="font-bold text-[var(--duo-fg)]">Evolução de Peso</h2>
				</div>
				{weightGain !== null && weightGain !== undefined ? (
					<div className="text-right">
						<div
							className={`text-2xl font-bold ${
								hasWeightLossGoal
									? weightGain < 0
										? "text-duo-green"
										: weightGain > 0
											? "text-duo-blue"
											: "text-duo-gray-dark"
									: weightGain > 0
										? "text-duo-green"
										: weightGain < 0
											? "text-duo-blue"
											: "text-duo-gray-dark"
							}`}
						>
							{weightGain > 0 ? "+" : ""}
							{weightGain.toFixed(1)}kg
						</div>
						<div className="text-xs text-duo-gray-dark">
							{weightGain < 0
								? "Perda"
								: weightGain > 0
									? "Ganho"
									: "Sem mudança"}{" "}
							no último mês
						</div>
					</div>
				) : null}
			</DuoCard.Header>
			{weightHistory.length > 0 ? (
				<div className="space-y-3">
					{weightHistory.map((record) => (
						<div
							key={`${String(record.date)}-${record.weight}`}
							className="flex items-center justify-between"
						>
							<div className="text-sm text-duo-gray-dark">
								{new Date(record.date).toLocaleDateString("pt-BR")}
							</div>
							<div className="flex items-center gap-3">
								<div
									className="h-2 flex-1 rounded-full bg-duo-border"
									style={{ width: `${record.weight}px` }}
								>
									<div
										className="h-full rounded-full bg-duo-green"
										style={{ width: `${(record.weight / 85) * 100}%` }}
									/>
								</div>
								<div className="w-16 text-right font-bold text-duo-text">
									{record.weight}kg
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex flex-col items-center justify-center py-8 px-4 text-center"
				>
					<Target className="h-12 w-12 text-duo-gray-dark mb-4 opacity-50" />
					<h3 className="text-lg font-bold text-duo-text mb-2">
						Comece sua jornada!
					</h3>
					<p className="text-sm text-duo-gray-dark mb-4 max-w-sm">
						Registre seu peso para acompanhar sua evolução e ver seu progresso
						ao longo do tempo.
					</p>
					<DuoButton
						onClick={onOpenWeightModal}
						variant="primary"
						className="w-full max-w-xs"
					>
						<Edit className="h-4 w-4 mr-2" />
						Registrar Peso Inicial
					</DuoButton>
				</motion.div>
			)}
		</DuoCard.Root>
	);
}
