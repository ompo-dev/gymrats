"use client";

import { SlideIn } from "@/components/animations/slide-in";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EquipmentInfoTab } from "./equipment-info-tab";
import { EquipmentMaintenanceTab } from "./equipment-maintenance-tab";
import { EquipmentUsageTab } from "./equipment-usage-tab";
import type { Equipment } from "@/lib/types";

export interface EquipmentTabsProps {
	equipment: Equipment;
}

export function EquipmentTabs({ equipment }: EquipmentTabsProps) {
	return (
		<SlideIn delay={0.3}>
			<Tabs defaultValue="usage" className="space-y-4 sm:space-y-6">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="usage" className="text-xs sm:text-sm">
						<span className="hidden sm:inline">Estatísticas de Uso</span>
						<span className="sm:hidden">Uso</span>
					</TabsTrigger>
					<TabsTrigger value="maintenance" className="text-xs sm:text-sm">
						Manutenção
					</TabsTrigger>
					<TabsTrigger value="info" className="text-xs sm:text-sm">
						Informações
					</TabsTrigger>
				</TabsList>

				<TabsContent value="usage">
					<EquipmentUsageTab equipment={equipment} />
				</TabsContent>

				<TabsContent value="maintenance">
					<EquipmentMaintenanceTab equipment={equipment} />
				</TabsContent>

				<TabsContent value="info">
					<EquipmentInfoTab equipment={equipment} />
				</TabsContent>
			</Tabs>
		</SlideIn>
	);
}
