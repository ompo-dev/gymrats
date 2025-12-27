"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { StepCard } from "@/components/molecules/cards/step-card";
import {
  calculateMetabolicData,
  type MetabolicCalculation,
} from "@/lib/metabolic-calculator";
import type { StepProps } from "./types";
import { validateStep6 } from "../schemas";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Zap,
  Apple,
  Beef,
  Wheat,
} from "lucide-react";

export function Step5({ formData, setFormData }: StepProps) {
  const [calculation, setCalculation] = useState<MetabolicCalculation | null>(
    null
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
        gender: formData.gender as any,
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
          validation.error.errors[0]?.message || "Erro na validação"
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
  ]);

  if (!calculation) {
    return (
      <StepCard
        title="Calculando seus valores..."
        description="Aguarde enquanto calculamos seus valores metabólicos"
      >
        <div className="flex items-center justify-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 rounded-full border-4 border-duo-green border-t-transparent"
          />
        </div>
      </StepCard>
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
    <StepCard
      title="Seu Plano Personalizado"
      description="Valores calculados especialmente para você"
    >
      <div className="space-y-6">
        {/* Resumo dos Valores Principais */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border-2 border-duo-green/30 bg-duo-green/5 p-4"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Activity className="h-4 w-4" />
              TMB (Basal)
            </div>
            <div className="mt-2 text-2xl font-bold text-duo-green">
              {calculation.bmr}
            </div>
            <div className="text-xs text-gray-600">kcal/dia</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border-2 border-duo-green/30 bg-duo-green/5 p-4"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Zap className="h-4 w-4" />
              TDEE (Total)
            </div>
            <div className="mt-2 text-2xl font-bold text-duo-green">
              {calculation.tdee}
            </div>
            <div className="text-xs text-gray-600">kcal/dia</div>
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
          <h3 className="text-lg font-bold text-gray-900">Macronutrientes</h3>

          {/* Proteína */}
          <div className="rounded-xl border-2 border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <Beef className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-900">Proteína</div>
                <div className="text-xs text-gray-600">
                  {calculation.macroPercentages.protein}% •{" "}
                  {calculation.macros.protein}g
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">
                  {calculation.macros.protein}
                </div>
                <div className="text-xs text-gray-500">gramas</div>
              </div>
            </div>
          </div>

          {/* Carboidratos */}
          <div className="rounded-xl border-2 border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <Wheat className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-900">Carboidratos</div>
                <div className="text-xs text-gray-600">
                  {calculation.macroPercentages.carbs}% •{" "}
                  {calculation.macros.carbs}g
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-600">
                  {calculation.macros.carbs}
                </div>
                <div className="text-xs text-gray-500">gramas</div>
              </div>
            </div>
          </div>

          {/* Gorduras */}
          <div className="rounded-xl border-2 border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <Apple className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-900">Gorduras</div>
                <div className="text-xs text-gray-600">
                  {calculation.macroPercentages.fats}% •{" "}
                  {calculation.macros.fats}g
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600">
                  {calculation.macros.fats}
                </div>
                <div className="text-xs text-gray-500">gramas</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Erro de Validação */}
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border-2 border-red-500 bg-red-50 p-4"
          >
            <p className="text-sm font-bold text-red-600">{validationError}</p>
          </motion.div>
        )}

        {/* Informações Adicionais */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 text-xs text-gray-600"
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
    </StepCard>
  );
}
