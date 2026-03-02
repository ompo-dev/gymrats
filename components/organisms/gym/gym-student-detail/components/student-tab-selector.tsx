"use client";

import { Dumbbell } from "lucide-react";
import { DuoCard, DuoSelect } from "@/components/duo";
import type { StudentDetailTab } from "../hooks/use-gym-student-detail";

export interface StudentTabSelectorProps {
  activeTab: StudentDetailTab;
  onTabChange: (tab: StudentDetailTab) => void;
  tabOptions: Array<{ value: string; label: string; emoji: string }>;
}

export function StudentTabSelector({
  activeTab,
  onTabChange,
  tabOptions,
}: StudentTabSelectorProps) {
  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <Dumbbell
            className="h-5 w-5 shrink-0"
            style={{ color: "var(--duo-secondary)" }}
            aria-hidden
          />
          <h2 className="font-bold text-[var(--duo-fg)]">
            Selecione a Categoria
          </h2>
        </div>
      </DuoCard.Header>
      <DuoSelect.Simple
        options={tabOptions}
        value={activeTab}
        onChange={(value) => onTabChange(value as StudentDetailTab)}
        placeholder="Selecione a categoria"
      />
    </DuoCard.Root>
  );
}
