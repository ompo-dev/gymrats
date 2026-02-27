"use client";

import { Thermometer } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { StepCard } from "@/components/molecules/cards/step-card";
import { CustomCheckbox } from "@/components/ui/custom-checkbox";
import { FormInput } from "@/components/ui/form-input";
import { DuoButton, DuoSelect } from "@/components/duo";
import { RangeSlider } from "@/components/ui/range-slider";
import {
  type consolidatedStep1Schema,
  validateConsolidatedStep1,
} from "../schemas";
import type { DifficultyLevel, OnboardingData, StepProps } from "./types";

const activityLevelDescriptions: Record<
  number,
  { label: string; description: string; example: string }
> = {
  1: {
    label: "Sedentário Total",
    description: "Sem exercício, trabalho sentado",
    example: "Pessoa acamada ou muito limitada",
  },
  2: {
    label: "Muito Sedentário",
    description: "Pouco ou nenhum exercício",
    example: "Trabalho de escritório, sem atividades físicas",
  },
  3: {
    label: "Sedentário Leve",
    description: "Exercício leve 1-2x/semana",
    example: "Caminhadas ocasionais",
  },
  4: {
    label: "Levemente Ativo",
    description: "Exercício leve 3-5x/semana",
    example: "Trabalho home office, exercícios leves",
  },
  5: {
    label: "Moderadamente Ativo",
    description: "Exercício moderado 3-5x/semana",
    example: "Trabalho de escritório com exercícios regulares",
  },
  6: {
    label: "Ativo",
    description: "Exercício pesado 3-5x/semana",
    example: "Trabalho que requer movimento constante",
  },
  7: {
    label: "Muito Ativo",
    description: "Exercício pesado 6-7x/semana",
    example: "Trabalho físico moderado",
  },
  8: {
    label: "Extremamente Ativo",
    description: "Exercício muito pesado diário",
    example: "Trabalho na construção, trabalho físico pesado",
  },
  9: {
    label: "Atleta",
    description: "Treino intenso 2x/dia",
    example: "Atleta de alto rendimento",
  },
  10: {
    label: "Atleta Elite",
    description: "Treino extremo, competição",
    example: "Atleta profissional de alto rendimento",
  },
};

export function ConsolidatedStep1({
  formData,
  setFormData,
  forceValidation,
}: StepProps) {
  const [errors, setErrors] = useState<
    Partial<Record<keyof z.infer<typeof consolidatedStep1Schema>, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof z.infer<typeof consolidatedStep1Schema>, boolean>>
  >({});

  useEffect(() => {
    if (forceValidation) {
      setTouched({
        age: true,
        height: true,
        weight: true,
        gender: true,
        fitnessLevel: true,
        goals: true,
        weeklyWorkoutFrequency: true,
        workoutDuration: true,
        gymType: true,
        activityLevel: true,
      });
    }
  }, [forceValidation]);

  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const validation = validateConsolidatedStep1({
        age: typeof formData.age === "number" ? formData.age : undefined,
        gender: formData.gender || undefined,
        isTrans: formData.isTrans,
        usesHormones: formData.usesHormones,
        hormoneType: formData.hormoneType || undefined,
        height:
          typeof formData.height === "number" ? formData.height : undefined,
        weight:
          typeof formData.weight === "number" ? formData.weight : undefined,
        fitnessLevel: formData.fitnessLevel || undefined,
        goals: formData.goals,
        weeklyWorkoutFrequency: formData.weeklyWorkoutFrequency,
        workoutDuration: formData.workoutDuration,
        gymType: formData.gymType || undefined,
        activityLevel: formData.activityLevel,
        hormoneTreatmentDuration: formData.hormoneTreatmentDuration,
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
  }, [formData, touched]);

  const validateField = (
    field: keyof z.infer<typeof consolidatedStep1Schema>,
  ) => {
    const validation = validateConsolidatedStep1({
      age: typeof formData.age === "number" ? formData.age : undefined,
      gender: formData.gender || undefined,
      isTrans: formData.isTrans,
      usesHormones: formData.usesHormones,
      hormoneType: formData.hormoneType || undefined,
      height: typeof formData.height === "number" ? formData.height : undefined,
      weight: typeof formData.weight === "number" ? formData.weight : undefined,
      fitnessLevel: formData.fitnessLevel || undefined,
      goals: formData.goals,
      weeklyWorkoutFrequency: formData.weeklyWorkoutFrequency,
      workoutDuration: formData.workoutDuration,
      gymType: formData.gymType || undefined,
      activityLevel: formData.activityLevel,
      hormoneTreatmentDuration: formData.hormoneTreatmentDuration,
    });

    if (!validation.success) {
      const fieldError = validation.error.errors.find(
        (err) => err.path[0] === field,
      );
      if (fieldError) {
        setErrors((prev) => ({ ...prev, [field]: fieldError.message }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const currentActivityLevel = formData.activityLevel ?? 4;
  const activityInfo =
    activityLevelDescriptions[currentActivityLevel] ||
    activityLevelDescriptions[4];

  return (
    <StepCard
      title="Quem é você"
      description="Vamos conhecer você para personalizar sua experiência"
    >
      <div className="space-y-8">
        {/* Seção 1: Informações Pessoais */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600">
            Informações Pessoais
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormInput
              label="Idade"
              type="number"
              placeholder="25"
              value={formData.age}
              onChange={(value) => {
                setFormData({ ...formData, age: value as number | "" });
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, age: true }));
                validateField("age");
              }}
              required
              error={touched.age ? errors.age : undefined}
              delay={0}
              min={13}
              max={120}
            />
            <FormInput
              label="Altura (cm)"
              type="number"
              placeholder="170"
              value={formData.height}
              onChange={(value) => {
                setFormData({ ...formData, height: value as number | "" });
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, height: true }));
                validateField("height");
              }}
              required
              error={touched.height ? errors.height : undefined}
              delay={0}
              min={100}
              max={250}
            />
            <FormInput
              label="Peso (kg)"
              type="number"
              placeholder="70"
              value={formData.weight}
              onChange={(value) => {
                setFormData({ ...formData, weight: value as number | "" });
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, weight: true }));
                validateField("weight");
              }}
              required
              error={touched.weight ? errors.weight : undefined}
              delay={0}
              min={30}
              max={300}
            />
          </div>

          <div className="space-y-2">
            <span className="block text-sm font-bold text-gray-900">
              Gênero
            </span>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "male", label: "Masculino" },
                { value: "trans-male", label: "Trans Masculino" },
                { value: "female", label: "Feminino" },
                { value: "trans-female", label: "Trans Feminino" },
              ].map((option) => (
                <DuoButton
                  key={option.value}
                  type="button"
                  variant={formData.gender === option.value ? "primary" : "outline"}
                  onClick={() => {
                    const isTrans = option.value.includes("trans");
                    setFormData({
                      ...formData,
                      gender: option.value as OnboardingData["gender"],
                      isTrans,
                      usesHormones: isTrans ? formData.usesHormones : false,
                      hormoneType: isTrans ? formData.hormoneType : "",
                    });
                    setTouched((prev) => ({ ...prev, gender: true }));
                  }}
                  className={`rounded-2xl py-3 ${
                    formData.gender !== option.value
                      ? "border-duo-border bg-duo-bg-card text-duo-text hover:border-duo-green/50"
                      : ""
                  }`}
                >
                  {option.label}
                </DuoButton>
              ))}
            </div>
            {(formData.gender === "trans-male" ||
              formData.gender === "trans-female") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 space-y-4 rounded-xl border-2 border-duo-green/30 bg-duo-green/5 p-4"
              >
                <CustomCheckbox
                  checked={formData.usesHormones}
                  onChange={(checked) =>
                    setFormData({
                      ...formData,
                      usesHormones: checked,
                      hormoneType: checked ? formData.hormoneType : "",
                    })
                  }
                  label="Faço uso de terapia hormonal"
                  delay={0}
                />
                {formData.usesHormones && (
                  <>
                    <DuoSelect.Simple
                      options={[
                        { value: "testosterone", label: "Testosterona" },
                        { value: "estrogen", label: "Estrogênio" },
                      ]}
                      value={formData.hormoneType}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          hormoneType: value as OnboardingData["hormoneType"],
                        })
                      }
                      label="Tipo de hormônio"
                      placeholder="Selecione"
                    />
                    <FormInput
                      label="Meses de tratamento"
                      type="number"
                      placeholder="0"
                      value={formData.hormoneTreatmentDuration ?? ""}
                      onChange={(value) => {
                        setFormData({
                          ...formData,
                          hormoneTreatmentDuration:
                            typeof value === "number" ? value : undefined,
                        });
                      }}
                      onBlur={() =>
                        setTouched((prev) => ({
                          ...prev,
                          hormoneTreatmentDuration: true,
                        }))
                      }
                      error={
                        touched.hormoneTreatmentDuration
                          ? errors.hormoneTreatmentDuration
                          : undefined
                      }
                      min={0}
                      max={120}
                      delay={0}
                    />
                  </>
                )}
              </motion.div>
            )}
          </div>

          <DuoSelect.Simple
            options={[
              { value: "iniciante", label: "Iniciante" },
              { value: "intermediario", label: "Intermediário" },
              { value: "avancado", label: "Avançado" },
            ]}
            value={formData.fitnessLevel}
            onChange={(value) =>
              setFormData({
                ...formData,
                fitnessLevel: value as DifficultyLevel,
              })
            }
            label="Nível de Experiência"
            placeholder="Selecione"
          />
        </motion.div>

        {/* Seção 2: Objetivo principal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600">
            Objetivo Principal
          </h3>
          <DuoSelect.Simple
            options={[
              { value: "perder-peso", label: "Perder Peso", emoji: "⚖️" },
              { value: "ganhar-massa", label: "Ganhar Massa", emoji: "💪" },
              { value: "definir", label: "Definir / Manter", emoji: "✨" },
            ]}
            value={formData.goals.length > 0 ? formData.goals[0] : ""}
            onChange={(value) => {
              const goal = value as
                | "perder-peso"
                | "ganhar-massa"
                | "definir"
                | "saude"
                | "forca"
                | "resistencia";
              setFormData({
                ...formData,
                goals: goal ? [goal] : [],
              });
              setTouched((prev) => ({ ...prev, goals: true }));
            }}
            label="O que você quer alcançar?"
            placeholder="Selecione"
          />
          {touched.goals && errors.goals && (
            <p className="text-sm font-bold text-red-500">{errors.goals}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <DuoSelect.Simple
              options={[1, 2, 3, 4, 5, 6, 7].map((num) => ({
                value: String(num),
                label: String(num),
              }))}
              value={String(formData.weeklyWorkoutFrequency)}
              onChange={(value) => {
                setFormData({
                  ...formData,
                  weeklyWorkoutFrequency: parseInt(value, 10),
                });
                setTouched((prev) => ({
                  ...prev,
                  weeklyWorkoutFrequency: true,
                }));
              }}
              label="Treinos por semana"
              placeholder="Selecione"
            />
            <div>
              <RangeSlider
                min={20}
                max={120}
                step={10}
                value={formData.workoutDuration}
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    workoutDuration: value,
                  });
                  setTouched((prev) => ({ ...prev, workoutDuration: true }));
                }}
                label="Duração por treino"
                unit="min"
                size="lg"
                delay={0}
              />
            </div>
          </div>
        </motion.div>

        {/* Seção 3: Equipamentos */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600">
            Equipamentos
          </h3>
          <DuoSelect.Simple
            options={[
              { value: "academia-completa", label: "Academia Completa", emoji: "🏢" },
              { value: "academia-basica", label: "Academia Básica", emoji: "🏠" },
              { value: "home-gym", label: "Home Gym", emoji: "🏡" },
              { value: "peso-corporal", label: "Só Peso Corporal", emoji: "🤸" },
            ]}
            value={formData.gymType || ""}
            onChange={(value) => {
              setFormData({
                ...formData,
                gymType: value as OnboardingData["gymType"],
              });
              setTouched((prev) => ({ ...prev, gymType: true }));
            }}
            label="O que você tem acesso?"
            placeholder="Selecione"
          />
          {touched.gymType && errors.gymType && (
            <p className="text-sm font-bold text-red-500">{errors.gymType}</p>
          )}
        </motion.div>

        {/* Seção 4: Nível de Atividade */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-duo-green" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600">
              Nível de Atividade Física (1-10)
            </h3>
          </div>
          <RangeSlider
            min={1}
            max={10}
            step={1}
            value={currentActivityLevel}
            onChange={(value) => {
              setFormData({
                ...formData,
                activityLevel: value,
              });
              setTouched((prev) => ({ ...prev, activityLevel: true }));
            }}
            label=""
            unit=""
            showValue={true}
            size="lg"
            delay={0}
          />
          <motion.div
            key={currentActivityLevel}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border-2 border-duo-green bg-duo-green/5 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">
                {activityInfo.label}
              </span>
              <span className="text-xl font-black text-duo-green">
                {currentActivityLevel}/10
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              {activityInfo.description}
            </p>
          </motion.div>
          {touched.activityLevel && errors.activityLevel && (
            <p className="text-sm font-bold text-red-500">
              {errors.activityLevel}
            </p>
          )}
        </motion.div>
      </div>
    </StepCard>
  );
}
