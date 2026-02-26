"use client";

import { Dumbbell, Flame, ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/atoms/buttons/button";
import { DuoCard } from "@/components/duo";
import { DuoCardHeader } from "@/components/duo";
import { useStudent } from "@/hooks/use-student";

interface ShopCardProps {
	totalXP?: number;
}

export function ShopCard({ totalXP }: ShopCardProps) {
	const { totalXP: storeXP } = useStudent("totalXP");
	const currentXP = totalXP ?? storeXP ?? 0;
	return (
		<DuoCard variant="default" padding="md">
			<DuoCardHeader>
				<div className="flex items-center gap-2">
					<ShoppingBag className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
					<h2 className="font-bold text-[var(--duo-fg)]">Loja de Recursos</h2>
				</div>
				<p className="text-xs text-duo-gray-dark">Troque XP por benefícios</p>
			</DuoCardHeader>
			<div className="space-y-3">
				<DuoCard
					variant="default"
					size="sm"
					className="flex items-center justify-between p-3"
				>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-duo-orange/10">
							<Flame className="h-5 w-5 text-duo-orange" />
						</div>
						<div>
							<p className="text-sm font-bold text-duo-text">
								Proteção de Streak
							</p>
							<p className="text-xs text-duo-gray-dark">1 dia de proteção</p>
						</div>
					</div>
					<Button
						variant="light-blue"
						size="sm"
						className="h-auto gap-1.5 px-3 py-1.5 text-xs"
						disabled={currentXP < 200}
					>
						<Zap className="h-3 w-3" />
						200
					</Button>
				</DuoCard>

				<DuoCard
					variant="default"
					size="sm"
					className="flex items-center justify-between p-3"
				>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-duo-green/10">
							<Dumbbell className="h-5 w-5 text-duo-green" />
						</div>
						<div>
							<p className="text-sm font-bold text-duo-text">
								Treino Personalizado
							</p>
							<p className="text-xs text-duo-gray-dark">Gerado por IA</p>
						</div>
					</div>
					<Button
						variant="light-blue"
						size="sm"
						className="h-auto gap-1.5 px-3 py-1.5 text-xs"
						disabled={currentXP < 500}
					>
						<Zap className="h-3 w-3" />
						500
					</Button>
				</DuoCard>
			</div>
		</DuoCard>
	);
}
