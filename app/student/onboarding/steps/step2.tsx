"use client";

import { StepCard } from "@/components/molecules/cards/step-card";
import { OptionSelector } from "@/components/ui/option-selector";
import { RangeSlider } from "@/components/ui/range-slider";
import type { StepProps } from "./types";

export function Step2({ formData, setFormData }: StepProps) {
  return (
    <StepCard title="Objetivos" description="O que você quer alcançar?">
      <div className="space-y-6">
        <OptionSelector
          options={[
            {
              value: "perder-peso",
              label: "Perder Peso",
              emoji: "⚖️",
            },
            {
              value: "ganhar-massa",
              label: "Ganhar Massa",
              emoji: "💪",
            },
            {
              value: "definir",
              label: "Definir Músculos",
              emoji: "✨",
            },
            { value: "saude", label: "Saúde Geral", emoji: "❤️" },
            { value: "forca", label: "Ganhar Força", emoji: "🏋️" },
            {
              value: "resistencia",
              label: "Resistência",
              emoji: "🏃",
            },
          ]}
          value={formData.goals}
          onChange={(value) => {
            const goals = formData.goals.includes(value)
              ? formData.goals.filter((g) => g !== value)
              : [...formData.goals, value];
            setFormData({ ...formData, goals });
          }}
          multiple
          layout="grid"
          columns={2}
          size="md"
          delay={0.3}
          label="Selecione seus objetivos"
        />

        <OptionSelector
          options={[1, 2, 3, 4, 5, 6, 7].map((num) => ({
            value: String(num),
            label: String(num),
          }))}
          value={String(formData.weeklyWorkoutFrequency)}
          onChange={(value) =>
            setFormData({
              ...formData,
              weeklyWorkoutFrequency: parseInt(value),
            })
          }
          layout="grid"
          columns={7}
          size="sm"
          showCheck={false}
          delay={0.6}
          label="Quantas vezes por semana pode treinar?"
        />

        <div>
          <RangeSlider
            min={20}
            max={120}
            step={10}
            value={formData.workoutDuration}
            onChange={(value) =>
              setFormData({
                ...formData,
                workoutDuration: value,
              })
            }
            label="Duração preferida por treino"
            unit="min"
            size="lg"
            delay={0.9}
          />
        </div>
      </div>
    </StepCard>
  );
}
