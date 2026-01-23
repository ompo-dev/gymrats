"use client";

import { useState, useEffect } from "react";
import { StepCard } from "@/components/molecules/cards/step-card";
import { OptionSelector } from "@/components/ui/option-selector";
import type { StepProps } from "./types";
import { validateStep3, step3Schema } from "../schemas";
import type { z } from "zod";

export function Step3({ formData, setFormData, forceValidation }: StepProps) {
  const [errors, setErrors] = useState<
    Partial<Record<keyof z.infer<typeof step3Schema>, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof z.infer<typeof step3Schema>, boolean>>
  >({});

  // Marca todos os campos como touched quando forceValidation é true
  useEffect(() => {
    if (forceValidation) {
      setTouched({
        preferredSets: true,
        preferredRepRange: true,
        restTime: true,
      });
    }
  }, [forceValidation]);

  // Valida apenas campos que foram tocados
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const validation = validateStep3({
        preferredSets: formData.preferredSets,
        preferredRepRange: formData.preferredRepRange,
        restTime: formData.restTime,
      });

      if (!validation.success) {
        const fieldErrors: typeof errors = {};
        validation.error.errors.forEach((err) => {
          const path = err.path[0] as keyof typeof fieldErrors;
          if (path && touched[path]) {
            fieldErrors[path] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({});
      }
    }
  }, [formData.preferredSets, formData.preferredRepRange, formData.restTime, touched]);

  return (
    <StepCard title="Preferências" description="Como você gosta de treinar?">
      <div className="space-y-6">
        <OptionSelector
          options={[2, 3, 4, 5].map((num) => ({
            value: String(num),
            label: `${num}x`,
          }))}
          value={String(formData.preferredSets)}
          onChange={(value) => {
            setFormData({
              ...formData,
              preferredSets: parseInt(value),
            });
            setTouched((prev) => ({ ...prev, preferredSets: true }));
          }}
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
          onChange={(value) => {
            setFormData({
              ...formData,
              preferredRepRange: value as any,
            });
            setTouched((prev) => ({ ...prev, preferredRepRange: true }));
          }}
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
          onChange={(value) => {
            setFormData({
              ...formData,
              restTime: value as any,
            });
            setTouched((prev) => ({ ...prev, restTime: true }));
          }}
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
