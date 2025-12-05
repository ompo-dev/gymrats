"use client";

import { StepCard } from "@/components/ui/step-card";
import { OptionSelector } from "@/components/ui/option-selector";
import { StepProps } from "./types";

const STEPS = [
  {
    number: 3,
    title: "Preferências",
    icon: "🏋️",
    color: "from-orange-400 to-orange-600",
  },
];

export function Step3({ formData, setFormData }: StepProps) {
  return (
    <StepCard
      title={STEPS[0].title}
      description="Como você gosta de treinar?"
    >

        <div className="space-y-6">
          <OptionSelector
            options={[2, 3, 4, 5].map((num) => ({
              value: String(num),
              label: `${num}x`,
            }))}
            value={String(formData.preferredSets)}
            onChange={(value) =>
              setFormData({
                ...formData,
                preferredSets: parseInt(value),
              })
            }
            layout="grid"
            columns={4}
            size="md"
            showCheck={false}
            delay={0.3}
            label="Número de séries por exercício"
          />

          <OptionSelector
            options={[
              {
                value: "forca",
                label: "Força (1-5 reps)",
                description: "Peso muito alto",
              },
              {
                value: "hipertrofia",
                label: "Hipertrofia (8-12 reps)",
                description: "Crescimento muscular",
              },
              {
                value: "resistencia",
                label: "Resistência (15+ reps)",
                description: "Definição e tônus",
              },
            ]}
            value={formData.preferredRepRange}
            onChange={(value) =>
              setFormData({
                ...formData,
                preferredRepRange: value as any,
              })
            }
            layout="list"
            size="md"
            textAlign="left"
            delay={0.5}
            label="Faixa de repetições"
          />

          <OptionSelector
            options={[
              {
                value: "curto",
                label: "Curto",
                description: "30-45s",
              },
              {
                value: "medio",
                label: "Médio",
                description: "60-90s",
              },
              {
                value: "longo",
                label: "Longo",
                description: "2-3min",
              },
            ]}
            value={formData.restTime}
            onChange={(value) =>
              setFormData({
                ...formData,
                restTime: value as any,
              })
            }
            layout="grid"
            columns={3}
            size="sm"
            textAlign="center"
            showCheck={false}
            delay={0.9}
            label="Tempo de descanso entre séries"
          />
        </div>
    </StepCard>
  );
}

