"use client";

import { Flame, Trophy, TrendingUp, Zap } from "lucide-react";
import { DuoStatCard, DuoStatsGrid } from "@/components/duo";

export function StatCardsSection() {
	return (
		<DuoStatsGrid.Root columns={2}>
			<DuoStatCard.Simple
				icon={Flame}
				value={12}
				label="Streak"
				iconColor="var(--duo-accent)"
			/>
			<DuoStatCard.Simple
				icon={Zap}
				value={450}
				label="XP"
				iconColor="var(--duo-primary)"
			/>
			<DuoStatCard.Simple
				icon={Trophy}
				value={3}
				label="Nível"
				badge="Novo"
			/>
			<DuoStatCard.Simple
				icon={TrendingUp}
				value="#42"
				label="Ranking"
			/>
		</DuoStatsGrid.Root>
	);
}
