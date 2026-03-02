"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { DuoCard, DuoSelect } from "@/components/duo";
import { type step4Schema, validateStep4 } from "../schemas";
import type { OnboardingData, StepProps } from "./types";

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
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -50, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
    >
      <DuoCard.Root
        variant="outlined"
        padding="lg"
        className="border-2 border-duo-border bg-duo-bg-card shadow-2xl backdrop-blur-md"
      >
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-2xl font-bold text-duo-fg">Equipamentos</h2>
          <p className="text-sm text-duo-fg-muted">
            Selecione o que você tem acesso
          </p>
        </div>
        <div className="space-y-6">
          <div>
            <DuoSelect.Simple
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
                  gymType: value as OnboardingData["gymType"],
                });
                setTouched((prev) => ({ ...prev, gymType: true }));
              }}
              label="Tipo de academia"
              placeholder="Selecione"
            />
            {touched.gymType && errors.gymType && (
              <p className="mt-2 text-sm font-bold text-duo-danger">
                {errors.gymType}
              </p>
            )}
          </div>
        </div>
      </DuoCard.Root>
    </motion.div>
  );
}
