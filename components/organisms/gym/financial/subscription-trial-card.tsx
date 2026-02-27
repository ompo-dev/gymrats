"use client";

import { Gift } from "lucide-react";
import { DuoButton } from "@/components/duo";
import { DuoCard } from "@/components/duo";

interface SubscriptionTrialCardProps {
	onStartTrial: () => Promise<void>;
	isLoading: boolean;
}

export function SubscriptionTrialCard({
	onStartTrial,
	isLoading,
}: SubscriptionTrialCardProps) {
	return (
		<DuoCard.Root variant="blue" size="default" className="text-center">
			<Gift className="mx-auto mb-4 h-16 w-16 text-duo-blue" />
			<h2 className="mb-2 text-2xl font-bold text-duo-text">
				Experimente 14 dias grátis!
			</h2>
			<p className="mb-6 text-sm text-duo-gray-dark">
				Teste todas as funcionalidades e ofereça Premium aos seus alunos sem
				compromisso
			</p>
			<DuoButton
				onClick={onStartTrial}
				disabled={isLoading}
				className="w-full"
				size="lg"
			>
				{isLoading ? "Iniciando..." : "Iniciar Trial Grátis"}
			</DuoButton>
		</DuoCard.Root>
	);
}
