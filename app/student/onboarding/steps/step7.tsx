"use client";

import { Activity, AlertCircle, Heart, Stethoscope } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { DuoCard } from "@/components/duo";
import { LimitationSelector } from "@/components/molecules/limitation-selector";
import { type step7Schema, validateStep7 } from "../schemas";
import type { StepProps } from "./types";

// Opções de limitações físicas - categorias gerais
const physicalLimitations = [
  { value: "articulacoes", label: "Articulações" },
  { value: "costas", label: "Costas" },
  { value: "pernas", label: "Pernas" },
  { value: "bracos", label: "Braços" },
  { value: "pescoco", label: "Pescoço" },
  { value: "outras-fisicas", label: "Outras" },
];

// Opções de limitações motoras - categorias gerais
const motorLimitations = [
  { value: "mobilidade-reduzida", label: "Mobilidade Reduzida" },
  { value: "equilibrio", label: "Equilíbrio" },
  { value: "coordenacao", label: "Coordenação" },
  { value: "forca-reduzida", label: "Força Reduzida" },
  { value: "amplitude-movimento", label: "Amplitude de Movimento" },
  { value: "outras-motoras", label: "Outras" },
];

// Opções de condições médicas
const medicalConditions = [
  { value: "diabetes", label: "Diabetes" },
  { value: "hipertensao", label: "Hipertensão" },
  { value: "problemas-cardiacos", label: "Problemas Cardíacos" },
  { value: "asma", label: "Asma" },
  { value: "problemas-tireoide", label: "Problemas de Tireoide" },
  { value: "outras-medicas", label: "Outras" },
];

export function Step7({ formData, setFormData, forceValidation }: StepProps) {
  const [errors, setErrors] = useState<
    Partial<Record<keyof z.infer<typeof step7Schema>, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof z.infer<typeof step7Schema>, boolean>>
  >({});

  // Marca todos os campos como touched quando forceValidation é true
  useEffect(() => {
    if (forceValidation) {
      setTouched({
        physicalLimitations: true,
        motorLimitations: true,
        medicalConditions: true,
      });
    }
  }, [forceValidation]);

  // Valida apenas campos que foram tocados
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const validation = validateStep7({
        physicalLimitations: formData.physicalLimitations || [],
        motorLimitations: formData.motorLimitations || [],
        medicalConditions: formData.medicalConditions || [],
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
  }, [
    formData.physicalLimitations,
    formData.motorLimitations,
    formData.medicalConditions,
    touched,
  ]);

  const handleLimitationChange = (
    type: "physicalLimitations" | "motorLimitations" | "medicalConditions",
    values: string[],
  ) => {
    setFormData({
      ...formData,
      [type]: values,
    });
    setTouched((prev) => ({ ...prev, [type]: true }));
  };

  const handleDetailChange = (
    limitationKey: string,
    detailValue: string | string[],
  ) => {
    setFormData({
      ...formData,
      limitationDetails: {
        ...(formData.limitationDetails || {}),
        [limitationKey]: detailValue,
      },
    });
  };

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
          <h2 className="mb-2 text-2xl font-bold text-duo-fg">
            Limitações e Considerações
          </h2>
          <p className="text-sm text-duo-fg-muted">
            Nos ajude a criar um treino seguro e adequado para você
          </p>
        </div>
        <div className="space-y-6">
          {/* Limitações Físicas */}
          <LimitationSelector.Simple
            title="Você possui limitações físicas?"
            icon={Heart}
            iconColor="text-duo-danger"
            borderColor="border-duo-danger/30"
            bgColor="bg-duo-danger/10"
            options={physicalLimitations}
            selectedValues={formData.physicalLimitations || []}
            onChange={(values) =>
              handleLimitationChange("physicalLimitations", values)
            }
            limitationDetails={formData.limitationDetails}
            onDetailChange={handleDetailChange}
            detailConfig={{
              pernas: {
                type: "selector",
                label: "Qual parte das pernas?",
                options: [
                  { value: "joelhos", label: "Joelhos" },
                  { value: "quadris", label: "Quadris" },
                  { value: "tornozelos", label: "Tornozelos" },
                  { value: "geral", label: "Geral" },
                ],
              },
              bracos: {
                type: "selector",
                label: "Qual parte dos braços?",
                options: [
                  { value: "ombros", label: "Ombros" },
                  { value: "cotovelos", label: "Cotovelos" },
                  { value: "pulsos", label: "Pulsos" },
                  { value: "geral", label: "Geral" },
                ],
              },
              "outras-fisicas": {
                type: "text",
                label: "Descreva suas outras limitações físicas",
                placeholder: "Ex: Problemas específicos...",
              },
            }}
            delay={0.2}
            error={
              touched.physicalLimitations
                ? errors.physicalLimitations
                : undefined
            }
          />

          {/* Limitações Motoras */}
          <LimitationSelector.Simple
            title="Você possui limitações motoras?"
            icon={Activity}
            iconColor="text-duo-secondary"
            borderColor="border-duo-secondary/30"
            bgColor="bg-duo-secondary/10"
            options={motorLimitations}
            selectedValues={formData.motorLimitations || []}
            onChange={(values) =>
              handleLimitationChange("motorLimitations", values)
            }
            limitationDetails={formData.limitationDetails}
            onDetailChange={handleDetailChange}
            detailConfig={{
              "outras-motoras": {
                type: "text",
                label: "Descreva suas outras limitações motoras",
                placeholder: "Ex: Dificuldades específicas...",
              },
            }}
            delay={0.4}
            error={
              touched.motorLimitations ? errors.motorLimitations : undefined
            }
          />

          {/* Condições Médicas */}
          <LimitationSelector.Simple
            title="Você possui condições médicas?"
            icon={Stethoscope}
            iconColor="text-duo-accent"
            borderColor="border-duo-accent/30"
            bgColor="bg-duo-accent/10"
            options={medicalConditions}
            selectedValues={formData.medicalConditions || []}
            onChange={(values) =>
              handleLimitationChange("medicalConditions", values)
            }
            limitationDetails={formData.limitationDetails}
            onDetailChange={handleDetailChange}
            detailConfig={{
              diabetes: {
                type: "selector",
                label: "Tipo de diabetes",
                options: [
                  { value: "tipo-1", label: "Tipo 1" },
                  { value: "tipo-2", label: "Tipo 2" },
                  { value: "gestacional", label: "Gestacional" },
                  { value: "pre-diabetes", label: "Pré-diabetes" },
                ],
              },
              "problemas-cardiacos": {
                type: "selector",
                label: "Tipo de problema cardíaco",
                options: [
                  { value: "arritmia", label: "Arritmia" },
                  { value: "hipertensao", label: "Hipertensão" },
                  { value: "insuficiencia", label: "Insuficiência Cardíaca" },
                  { value: "outros-cardiacos", label: "Outros" },
                ],
              },
              "outras-medicas": {
                type: "text",
                label: "Descreva suas outras condições médicas",
                placeholder: "Ex: Condição específica, medicação em uso...",
              },
            }}
            delay={0.6}
            error={
              touched.medicalConditions ? errors.medicalConditions : undefined
            }
          />

          {/* Mensagem informativa */}
          {(formData.physicalLimitations?.length ||
            formData.motorLimitations?.length ||
            formData.medicalConditions?.length) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border-2 border-duo-secondary/30 bg-duo-secondary/10 p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-duo-secondary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-duo-fg">
                    Informações Importantes
                  </p>
                  <p className="text-xs text-duo-fg-muted mt-1">
                    Com base nas suas limitações, criaremos um treino
                    personalizado e seguro. Sempre consulte um profissional de
                    saúde antes de iniciar qualquer programa de exercícios.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </DuoCard.Root>
    </motion.div>
  );
}
