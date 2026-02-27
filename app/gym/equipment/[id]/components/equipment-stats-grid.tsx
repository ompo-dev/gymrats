"use client";

import { BarChart3, Calendar, Clock } from "lucide-react";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoStatCard, DuoStatsGrid } from "@/components/duo";
import type { Equipment } from "@/lib/types";

export interface EquipmentStatsGridProps {
	equipment: Equipment;
}

export function EquipmentStatsGrid({ equipment }: EquipmentStatsGridProps) {
	return (
		<SlideIn delay={0.2}>
			<DuoStatsGrid.Root columns={4}>
				<DuoStatCard.Simple
					icon={BarChart3}
					value={String(equipment.usageStats.totalUses)}
					label="Total de Usos"
					iconColor="#A560E8"
				/>
				<DuoStatCard.Simple
					icon={Clock}
					value={`${equipment.usageStats.avgUsageTime}min`}
					label="Tempo Médio"
					iconColor="var(--duo-secondary)"
				/>
				<DuoStatCard.Simple
					icon={Calendar}
					value={
						equipment.lastMaintenance?.toLocaleDateString("pt-BR") || "N/A"
					}
					label="Última Manutenção"
					iconColor="var(--duo-primary)"
				/>
				<DuoStatCard.Simple
					icon={Calendar}
					value={
						equipment.nextMaintenance?.toLocaleDateString("pt-BR") || "N/A"
					}
					label="Próxima Manutenção"
					iconColor="var(--duo-accent)"
				/>
			</DuoStatsGrid.Root>
		</SlideIn>
	);
}
