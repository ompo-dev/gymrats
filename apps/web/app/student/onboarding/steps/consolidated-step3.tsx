"use client";

import { Activity, AlertCircle, Heart, Stethoscope } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { DuoCard, DuoSelect } from "@/components/duo";
import { LimitationSelector } from "@/components/molecules/limitation-selector";
import type { step3Schema, step7Schema } from "../schemas";
import type { OnboardingData, StepProps } from "./types";

const physicalLimitations = [
  { value: "articulacoes", label: "Articulações" },
  { value: "costas", label: "Costas" },
  { value: "pernas", label: "Pernas" },
  { value: "bracos", label: "Braços" },
  { value: "pescoco", label: "Pescoço" },
  { value: "outras-fisicas", label: "Outras" },
];

const motorLimitations = [
  { value: "mobilidade-reduzida", label: "Mobilidade Reduzida" },
  { value: "equilibrio", label: "Equilíbrio" },
  { value: "coordenacao", label: "Coordenação" },
  { value: "forca-reduzida", label: "Força Reduzida" },
  { value: "amplitude-movimento", label: "Amplitude de Movimento" },
  { value: "outras-motoras", label: "Outras" },
];

const medicalConditions = [
  { value: "diabetes", label: "Diabetes" },
  { value: "hipertensao", label: "Hipertensão" },
  { value: "problemas-cardiacos", label: "Problemas Cardíacos" },
  { value: "asma", label: "Asma" },
  { value: "problemas-tireoide", label: "Problemas de Tireoide" },
  { value: "outras-medicas", label: "Outras" },
];

/**
 * Etapa 3 - "Algo mais?" (opcional, pode pular)
 * Combina preferências de treino (Step3) + limitações (Step7).
 * Todos os campos têm defaults; usuário pode pular e completar depois em Configurações.
 */
export function ConsolidatedStep3({
  formData,
  setFormData,
  forceValidation,
}: StepProps) {
  const [, setTouched] = useState<
    Partial<
      Record<
        keyof z.infer<typeof step3Schema> | keyof z.infer<typeof step7Schema>,
        boolean
      >
    >
  >({});

  useEffect(() => {
    if (forceValidation) {
      setTouched({
        preferredSets: true,
        preferredRepRange: true,
        restTime: true,
        physicalLimitations: true,
        motorLimitations: true,
        medicalConditions: true,
      });
    }
  }, [forceValidation]);

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
          <h2 className="mb-2 text-2xl font-bold text-duo-fg">Algo mais?</h2>
          <p className="text-sm text-duo-fg-muted">
            Você pode completar depois em Configurações
          </p>
        </div>
        <div className="space-y-8">
          {/* Preferências de Treino */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-duo-fg-muted">
              Preferências de Treino
            </h3>
            <p className="text-sm text-duo-fg-muted">
              Como você gosta de treinar? (valores padrão já selecionados)
            </p>
            <DuoSelect.Simple
              options={[2, 3, 4, 5].map((num) => ({
                value: String(num),
                label: `${num}x`,
              }))}
              value={String(formData.preferredSets)}
              onChange={(value) => {
                setFormData({
                  ...formData,
                  preferredSets: parseInt(value, 10),
                });
              }}
              label="Número de séries por exercício"
              placeholder="Selecione"
            />

            <DuoSelect.Simple
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
                  preferredRepRange:
                    value as OnboardingData["preferredRepRange"],
                });
              }}
              label="Faixa de repetições"
              placeholder="Selecione"
            />

            <DuoSelect.Simple
              options={[
                { value: "curto", label: "Curto", description: "30-45s" },
                { value: "medio", label: "Médio", description: "60-90s" },
                { value: "longo", label: "Longo", description: "2-3min" },
              ]}
              value={formData.restTime}
              onChange={(value) => {
                setFormData({
                  ...formData,
                  restTime: value as OnboardingData["restTime"],
                });
              }}
              label="Tempo de descanso entre séries"
              placeholder="Selecione"
            />
          </motion.div>

          {/* Limitações e Condições Médicas */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-duo-fg-muted">
              Limitações e Considerações
            </h3>
            <p className="text-sm text-duo-fg-muted">
              Nos ajude a criar um treino seguro e adequado para você
            </p>

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
              delay={0}
            />

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
              delay={0}
            />

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
              delay={0}
            />

            {(formData.physicalLimitations?.length ||
              formData.motorLimitations?.length ||
              formData.medicalConditions?.length) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border-2 border-duo-secondary/30 bg-duo-secondary/10 p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-duo-secondary" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-duo-fg">
                      Informações Importantes
                    </p>
                    <p className="mt-1 text-xs text-duo-fg-muted">
                      Com base nas suas limitações, criaremos um treino
                      personalizado e seguro. Sempre consulte um profissional de
                      saúde antes de iniciar qualquer programa de exercícios.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </DuoCard.Root>
    </motion.div>
  );
}
