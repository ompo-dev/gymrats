"use client";

import { Dumbbell } from "lucide-react";
import { DuoCard } from "@/components/duo";
import type { Equipment } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface EquipmentInfoTabProps {
  equipment: Equipment;
}

const INFO_ITEMS = [
  {
    key: "purchaseDate",
    label: "Data de Compra",
    getValue: (e: Equipment) =>
      e.purchaseDate?.toLocaleDateString("pt-BR") || "N/A",
  },
  { key: "brand", label: "Marca", getValue: (e: Equipment) => e.brand },
  { key: "model", label: "Modelo", getValue: (e: Equipment) => e.model },
  {
    key: "serialNumber",
    label: "Número de Série",
    getValue: (e: Equipment) => e.serialNumber,
  },
  {
    key: "type",
    label: "Tipo",
    getValue: (e: Equipment) => e.type,
    capitalize: true,
  },
];

export function EquipmentInfoTab({ equipment }: EquipmentInfoTabProps) {
  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <Dumbbell
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--duo-secondary)" }}
            aria-hidden
          />
          <h2 className="font-bold text-duo-fg">Informações do Equipamento</h2>
        </div>
      </DuoCard.Header>
      <div className="space-y-3">
        {INFO_ITEMS.map((item) => (
          <DuoCard.Root key={item.key} variant="default" size="sm">
            <div className="flex flex-col justify-between gap-2 sm:flex-row">
              <span className="text-sm font-bold text-duo-gray-dark sm:text-base">
                {item.label}
              </span>
              <span
                className={cn(
                  "text-sm text-duo-text sm:text-base",
                  item.capitalize && "capitalize",
                )}
              >
                {item.getValue(equipment)}
              </span>
            </div>
          </DuoCard.Root>
        ))}
      </div>
    </DuoCard.Root>
  );
}
