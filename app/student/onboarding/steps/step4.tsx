"use client";

import { StepCard } from "@/components/ui/step-card";
import { OptionSelector } from "@/components/ui/option-selector";
import type { StepProps } from "./types";

export function Step4({ formData, setFormData }: StepProps) {
  return (
    <StepCard
      title="Equipamentos"
      description="Selecione o que você tem acesso"
    >
      <div className="space-y-6">
        <OptionSelector
          options={[
            {
              value: "academia-completa",
              label: "Academia Completa",
              emoji: "🏢",
            },
            {
              value: "academia-basica",
              label: "Academia Básica",
              emoji: "🏠",
            },
            { value: "home-gym", label: "Home Gym", emoji: "🏡" },
            {
              value: "peso-corporal",
              label: "Só Peso Corporal",
              emoji: "🤸",
            },
          ]}
          value={formData.gymType || ""}
          onChange={(value) =>
            setFormData({
              ...formData,
              gymType: value as any,
            })
          }
          layout="list"
          size="md"
          textAlign="center"
          showCheck={false}
          delay={0.3}
          label="Tipo de academia"
        />
      </div>
    </StepCard>
  );
}
