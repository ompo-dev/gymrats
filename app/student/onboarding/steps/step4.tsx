"use client";

import { useState, useEffect } from "react";
import { StepCard } from "@/components/molecules/cards/step-card";
import { OptionSelector } from "@/components/ui/option-selector";
import type { StepProps } from "./types";
import { validateStep4, step4Schema } from "../schemas";
import type { z } from "zod";

export function Step4({ formData, setFormData, forceValidation }: StepProps) {
  const [errors, setErrors] = useState<
    Partial<Record<keyof z.infer<typeof step4Schema>, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof z.infer<typeof step4Schema>, boolean>>
  >({});

  // Marca todos os campos como touched quando forceValidation é true
  useEffect(() => {
    if (forceValidation) {
      setTouched({ gymType: true });
    }
  }, [forceValidation]);

  // Valida apenas campos que foram tocados
  useEffect(() => {
    if (touched.gymType) {
      const validation = validateStep4({
        gymType: formData.gymType || undefined,
      });

      if (!validation.success) {
        const fieldErrors: typeof errors = {};
        validation.error.errors.forEach((err) => {
          const path = err.path[0] as keyof typeof fieldErrors;
          if (path) {
            fieldErrors[path] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({});
      }
    }
  }, [formData.gymType, touched.gymType]);

  return (
    <StepCard
      title="Equipamentos"
      description="Selecione o que você tem acesso"
    >
      <div className="space-y-6">
        <div>
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
            onChange={(value) => {
              setFormData({
                ...formData,
                gymType: value as any,
              });
              setTouched((prev) => ({ ...prev, gymType: true }));
            }}
            layout="list"
            size="md"
            textAlign="center"
            showCheck={false}
            delay={0.3}
            label="Tipo de academia"
          />
          {touched.gymType && errors.gymType && (
            <p className="mt-2 text-sm font-bold text-red-500">{errors.gymType}</p>
          )}
        </div>
      </div>
    </StepCard>
  );
}
