"use client";

import { Flame, Trophy, Zap } from "lucide-react";
import { DuoStatCard, DuoStatsGrid } from "@/components/duo";

export function StatsGridSection() {
	return (
		<DuoStatsGrid.Root columns={3}>
			<DuoStatCard.Simple icon={Flame} value={12} label="Streak" />
			<DuoStatCard.Simple icon={Zap} value={450} label="XP" />
			<DuoStatCard.Simple icon={Trophy} value={3} label="Nível" />
		</DuoStatsGrid.Root>
	);
}
