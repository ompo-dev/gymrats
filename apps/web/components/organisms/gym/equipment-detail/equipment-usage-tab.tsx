"use client";

import { BarChart3, Clock } from "lucide-react";
import { DuoCard } from "@/components/duo";
import type { Equipment } from "@/lib/types";
import { normalizeEquipmentItem } from "@/lib/utils/gym/normalize-equipment";

export interface EquipmentUsageTabProps {
  equipment: Equipment;
}

export function EquipmentUsageTab({ equipment }: EquipmentUsageTabProps) {
  const safeEquipment = normalizeEquipmentItem(equipment);
  const usagePercent = Math.round(
    (safeEquipment.usageStats.totalUses / 2000) * 100,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DuoCard.Root variant="highlighted" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <Clock
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-duo-fg">Horarios Mais Populares</h2>
          </div>
        </DuoCard.Header>
        <div className="space-y-3">
          {safeEquipment.usageStats.popularTimes.map((time) => (
            <DuoCard.Root key={time} variant="highlighted" size="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-duo-green" />
                  <span className="font-bold text-duo-text">{time}</span>
                </div>
                <span className="text-sm font-bold text-duo-gray-dark">
                  Alta demanda
                </span>
              </div>
            </DuoCard.Root>
          ))}
        </div>
      </DuoCard.Root>

      <DuoCard.Root variant="blue" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <BarChart3
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-duo-fg">Metricas de Performance</h2>
          </div>
        </DuoCard.Header>
        <div className="space-y-4">
          <DuoCard.Root variant="default" size="default">
            <p className="text-sm font-bold text-duo-gray-dark">
              Taxa de Utilizacao
            </p>
            <p className="text-3xl font-bold text-duo-purple">
              {usagePercent}%
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-duo-gray">
              <div
                className="h-full bg-duo-purple transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </DuoCard.Root>
          <DuoCard.Root variant="blue" size="default">
            <p className="text-sm font-bold text-duo-gray-dark">
              Eficiencia de Uso
            </p>
            <p className="text-3xl font-bold text-duo-blue">92%</p>
            <p className="text-xs text-duo-gray-dark">
              Baseado em tempo medio vs recomendado
            </p>
          </DuoCard.Root>
        </div>
      </DuoCard.Root>
    </div>
  );
}
