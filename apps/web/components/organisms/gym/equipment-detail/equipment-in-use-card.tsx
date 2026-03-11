"use client";

import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard } from "@/components/duo";
import { RelativeTime } from "@/components/molecules/relative-time";
import type { Equipment } from "@/lib/types";

export interface EquipmentInUseCardProps {
  equipment: Equipment;
}

export function EquipmentInUseCard({ equipment }: EquipmentInUseCardProps) {
  if (equipment.status !== "in-use" || !equipment.currentUser) return null;

  return (
    <SlideIn delay={0.15}>
      <DuoCard.Root variant="blue" size="default">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-duo-gray-dark sm:text-sm">
              Equipamento em uso por:
            </p>
            <p className="text-xl font-bold text-duo-blue sm:text-2xl">
              {equipment.currentUser.studentName}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-bold text-duo-gray-dark sm:text-sm">
              Tempo de Uso
            </p>
            <p className="text-2xl font-bold text-duo-blue sm:text-3xl">
              <RelativeTime timestamp={equipment.currentUser.startTime} />
            </p>
          </div>
        </div>
      </DuoCard.Root>
    </SlideIn>
  );
}
