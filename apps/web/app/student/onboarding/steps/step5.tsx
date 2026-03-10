"use client";

import {
  Activity,
  Apple,
  Beef,
  Target,
  TrendingDown,
  TrendingUp,
  Wheat,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { DuoCard } from "@/components/duo";
import {
  calculateMetabolicData,
  type MetabolicCalculation,
} from "@/lib/metabolic-calculator";
import { validateStep6 } from "../schemas";
import type { OnboardingData, StepProps } from "./types";

export function Step5({ formData, setFormData }: StepProps) {
  const [calculation, setCalculation] = useState<MetabolicCalculation | null>(
    null,
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (
      formData.age &&
      formData.height &&
      formData.weight &&
      formData.gender &&
      formData.fitnessLevel &&
      formData.goals.length > 0
    ) {
      const metabolicData = {
        age: typeof formData.age === "number" ? formData.age : 0,
        gender: formData.gender as Exclude<OnboardingData["gender"], "">,
        isTrans: formData.isTrans,
        usesHormones: formData.usesHormones,
        hormoneType: formData.hormoneType || undefined,
        hormoneTreatmentDuration:
          typeof formData.hormoneTreatmentDuration === "number"
            ? formData.hormoneTreatmentDuration
            : undefined,
        height: typeof formData.height === "number" ? formData.height : 0,
        weight: typeof formData.weight === "number" ? formData.weight : 0,
        fitnessLevel: formData.fitnessLevel,
        weeklyWorkoutFrequency: formData.weeklyWorkoutFrequency,
        workoutDuration: formData.workoutDuration,
        goals: formData.goals,
        activityLevel:
          typeof formData.activityLevel === "number"
            ? formData.activityLevel
            : undefined,
      };

      // Usa Harris-Benedict como padrão
      const calc = calculateMetabolicData(metabolicData, "harris-benedict");
      setCalculation(calc);

      // Sempre atualiza os valores calculados (permite recalcular quando activityLevel muda)
      const updatedData = {
        ...formData,
        bmr: calc.bmr,
        tdee: calc.tdee,
        targetCalories: calc.targetCalories,
        targetProtein: calc.macros.protein,
        targetCarbs: calc.macros.carbs,
        targetFats: calc.macros.fats,
      };

      // Valida os dados antes de salvar
      const validation = validateStep6({
        targetCalories: calc.targetCalories,
        targetProtein: calc.macros.protein,
        targetCarbs: calc.macros.carbs,
        targetFats: calc.macros.fats,
        bmr: calc.bmr,
        tdee: calc.tdee,
      });
      if (validation.success) {
        setFormData(updatedData);
        setValidationError(null);
      } else {
        setValidationError(
          validation.error.errors[0]?.message || "Erro na validação",
        );
      }
    }
  }, [
    formData.age,
    formData.height,
    formData.weight,
    formData.gender,
    formData.fitnessLevel,
    formData.goals,
    formData.weeklyWorkoutFrequency,
    formData.workoutDuration,
    formData.activityLevel,
    formData.hormoneTreatmentDuration,
    formData.hormoneType,
    formData.isTrans,
    formData.usesHormones,
    formData,
    setFormData,
  ]);

  if (!calculation) {
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
              Calculando seus valores...
            </h2>
            <p className="text-sm text-duo-fg-muted">
              Aguarde enquanto calculamos seus valores metabólicos
            </p>
          </div>
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-12 w-12 rounded-full border-4 border-duo-green border-t-transparent"
            />
          </div>
        </DuoCard.Root>
      </motion.div>
    );
  }

  const goalEmoji =
    calculation.metadata.goal === "cut"
      ? "🔥"
      : calculation.metadata.goal === "bulk"
        ? "💪"
        : "⚖️";

  const goalLabel =
    calculation.metadata.goal === "cut"
      ? "Perda de Peso"
      : calculation.metadata.goal === "bulk"
        ? "Ganho de Massa"
        : "Manutenção";

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
            Seu Plano Personalizado
          </h2>
          <p className="text-sm text-duo-fg-muted">
            Valores calculados especialmente para você
          </p>
        </div>
        <div className="space-y-6">
          {/* Resumo dos Valores Principais */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border-2 border-duo-green/30 bg-duo-green/5 p-4"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-duo-fg-muted">
                <Activity className="h-4 w-4" />
                TMB (Basal)
              </div>
              <div className="mt-2 text-2xl font-bold text-duo-green">
                {calculation.bmr}
              </div>
              <div className="text-xs text-duo-fg-muted">kcal/dia</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border-2 border-duo-green/30 bg-duo-green/5 p-4"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-duo-fg-muted">
                <Zap className="h-4 w-4" />
                TDEE (Total)
              </div>
              <div className="mt-2 text-2xl font-bold text-duo-green">
                {calculation.tdee}
              </div>
              <div className="text-xs text-duo-fg-muted">kcal/dia</div>
            </motion.div>
          </div>

          {/* Objetivo Calórico */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border-2 border-duo-green bg-duo-green p-4 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Target className="h-4 w-4" />
                  Meta Calórica Diária
                </div>
                <div className="mt-1 text-3xl font-bold">
                  {calculation.targetCalories} kcal
                </div>
                <div className="text-xs opacity-90">
                  {goalLabel} {goalEmoji}
                </div>
              </div>
              {calculation.metadata.goal === "cut" && (
                <TrendingDown className="h-8 w-8" />
              )}
              {calculation.metadata.goal === "bulk" && (
                <TrendingUp className="h-8 w-8" />
              )}
              {calculation.metadata.goal === "maintain" && (
                <Activity className="h-8 w-8" />
              )}
            </div>
          </motion.div>

          {/* Macronutrientes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-bold text-duo-fg">Macronutrientes</h3>

            {/* Proteína */}
            <div className="rounded-xl border-2 border-duo-border bg-duo-bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-duo-danger/20 p-2">
                  <Beef className="h-5 w-5 text-duo-danger" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-duo-fg">Proteína</div>
                  <div className="text-xs text-duo-fg-muted">
                    {calculation.macroPercentages.protein}% •{" "}
                    {calculation.macros.protein}g
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-duo-danger">
                    {calculation.macros.protein}
                  </div>
                  <div className="text-xs text-duo-fg-muted">gramas</div>
                </div>
              </div>
            </div>

            {/* Carboidratos */}
            <div className="rounded-xl border-2 border-duo-border bg-duo-bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-duo-warning/20 p-2">
                  <Wheat className="h-5 w-5 text-duo-warning" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-duo-fg">Carboidratos</div>
                  <div className="text-xs text-duo-fg-muted">
                    {calculation.macroPercentages.carbs}% •{" "}
                    {calculation.macros.carbs}g
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-duo-warning">
                    {calculation.macros.carbs}
                  </div>
                  <div className="text-xs text-duo-fg-muted">gramas</div>
                </div>
              </div>
            </div>

            {/* Gorduras */}
            <div className="rounded-xl border-2 border-duo-border bg-duo-bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-duo-accent/20 p-2">
                  <Apple className="h-5 w-5 text-duo-accent" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-duo-fg">Gorduras</div>
                  <div className="text-xs text-duo-fg-muted">
                    {calculation.macroPercentages.fats}% •{" "}
                    {calculation.macros.fats}g
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-duo-accent">
                    {calculation.macros.fats}
                  </div>
                  <div className="text-xs text-duo-fg-muted">gramas</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Erro de Validação */}
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border-2 border-duo-danger bg-duo-danger/10 p-4"
            >
              <p className="text-sm font-bold text-duo-danger">
                {validationError}
              </p>
            </motion.div>
          )}

          {/* Informações Adicionais */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl border-2 border-duo-border bg-duo-bg-elevated p-4 text-xs text-duo-fg-muted"
          >
            <div className="space-y-1">
              <div>
                <strong>Nível de Atividade:</strong>{" "}
                {calculation.metadata.activityLevel === "sedentary"
                  ? "Sedentário"
                  : calculation.metadata.activityLevel === "light"
                    ? "Leve"
                    : calculation.metadata.activityLevel === "moderate"
                      ? "Moderado"
                      : calculation.metadata.activityLevel === "active"
                        ? "Ativo"
                        : "Muito Ativo"}
              </div>
              <div>
                <strong>Fórmula:</strong>{" "}
                {calculation.metadata.formula === "mifflin-st-jeor"
                  ? "Mifflin-St Jeor"
                  : "Harris-Benedict"}
              </div>
              <div>
                <strong>Fator de Atividade:</strong>{" "}
                {calculation.activityFactor.toFixed(2)}x
              </div>
            </div>
          </motion.div>
        </div>
      </DuoCard.Root>
    </motion.div>
  );
}
