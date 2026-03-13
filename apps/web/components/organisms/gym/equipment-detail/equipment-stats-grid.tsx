"use client";

import { BarChart3, Calendar, Clock } from "lucide-react";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoStatCard, DuoStatsGrid } from "@/components/duo";
import type { Equipment } from "@/lib/types";
import { normalizeEquipmentItem } from "@/lib/utils/gym/normalize-equipment";

export interface EquipmentStatsGridProps {
  equipment: Equipment;
}

export function EquipmentStatsGrid({ equipment }: EquipmentStatsGridProps) {
  const safeEquipment = normalizeEquipmentItem(equipment);

  return (
    <SlideIn delay={0.2}>
      <DuoStatsGrid.Root columns={4}>
        <DuoStatCard.Simple
          icon={BarChart3}
          value={String(safeEquipment.usageStats.totalUses)}
          label="Total de Usos"
          iconColor="#A560E8"
        />
        <DuoStatCard.Simple
          icon={Clock}
          value={`${safeEquipment.usageStats.avgUsageTime}min`}
          label="Tempo Medio"
          iconColor="var(--duo-secondary)"
        />
        <DuoStatCard.Simple
          icon={Calendar}
          value={
            safeEquipment.lastMaintenance?.toLocaleDateString("pt-BR") || "N/A"
          }
          label="Ultima Manutencao"
          iconColor="var(--duo-primary)"
        />
        <DuoStatCard.Simple
          icon={Calendar}
          value={
            safeEquipment.nextMaintenance?.toLocaleDateString("pt-BR") || "N/A"
          }
          label="Proxima Manutencao"
          iconColor="var(--duo-accent)"
        />
      </DuoStatsGrid.Root>
    </SlideIn>
  );
}
