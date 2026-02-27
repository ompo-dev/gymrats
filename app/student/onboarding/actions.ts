"use server";

import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/services/email.service";
import { initializeStudentTrial } from "@/lib/utils/auto-trial";
import { getStudentContext } from "@/lib/utils/student/student-context";
import { validateOnboarding } from "./schemas";
import type { OnboardingData } from "./steps/types";

/** Dados aplicados antes da validação para onboarding simplificado (3 etapas) */
const ONBOARDING_DEFAULTS = {
  gymType: "academia-completa" as const,
  preferredSets: 3,
  preferredRepRange: "hipertrofia" as const,
  restTime: "medio" as const,
};

export async function submitOnboarding(formData: OnboardingData) {
  try {
    // Aplica defaults para dados opcionais (Etapa 3 pode ser pulada)
    const normalizedData = {
      ...formData,
      gymType: formData.gymType || ONBOARDING_DEFAULTS.gymType,
      preferredSets:
        formData.preferredSets ?? ONBOARDING_DEFAULTS.preferredSets,
      preferredRepRange:
        formData.preferredRepRange || ONBOARDING_DEFAULTS.preferredRepRange,
      restTime: formData.restTime || ONBOARDING_DEFAULTS.restTime,
    };

    // Valida dados com Zod antes de processar
    const validation = validateOnboarding({
      age:
        typeof normalizedData.age === "number" ? normalizedData.age : undefined,
      gender: normalizedData.gender || undefined,
      isTrans: normalizedData.isTrans,
      usesHormones: normalizedData.usesHormones,
      hormoneType: normalizedData.hormoneType || undefined,
      height:
        typeof normalizedData.height === "number"
          ? normalizedData.height
          : undefined,
      weight:
        typeof normalizedData.weight === "number"
          ? normalizedData.weight
          : undefined,
      fitnessLevel: normalizedData.fitnessLevel || undefined,
      goals: normalizedData.goals,
      weeklyWorkoutFrequency: normalizedData.weeklyWorkoutFrequency,
      workoutDuration: normalizedData.workoutDuration,
      gymType: normalizedData.gymType || undefined,
      preferredSets: normalizedData.preferredSets,
      preferredRepRange: normalizedData.preferredRepRange,
      restTime: normalizedData.restTime,
      targetCalories: normalizedData.targetCalories,
      targetProtein: normalizedData.targetProtein,
      targetCarbs: normalizedData.targetCarbs,
      targetFats: normalizedData.targetFats,
      activityLevel:
        typeof normalizedData.activityLevel === "number"
          ? normalizedData.activityLevel
          : undefined,
      hormoneTreatmentDuration:
        typeof normalizedData.hormoneTreatmentDuration === "number"
          ? normalizedData.hormoneTreatmentDuration
          : undefined,
      physicalLimitations: normalizedData.physicalLimitations || [],
      motorLimitations: normalizedData.motorLimitations || [],
      medicalConditions: normalizedData.medicalConditions || [],
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError?.message || "Dados inválidos",
      };
    }

    const { ctx, error } = await getStudentContext();

    if (error || !ctx) {
      return { success: false, error: error || "Sessão inválida" };
    }

    const userId = ctx.user.id;
    const user = ctx.user;

    if (user.role !== "STUDENT") {
      return { success: false, error: "Usuário não é um aluno" };
    }

    // Salvar ou atualizar dados do aluno
    const studentData = {
      age: typeof normalizedData.age === "number" ? normalizedData.age : null,
      gender: normalizedData.gender || null,
      isTrans: normalizedData.isTrans || false,
      usesHormones: normalizedData.usesHormones || false,
      hormoneType: normalizedData.hormoneType || null,
    };

    const student = await db.student.upsert({
      where: { id: ctx.studentId || "" },
      create: { ...studentData, userId: ctx.user.id },
      update: studentData,
    });

    // Salvar perfil via serviço
    await StudentProfileService.saveOnboardingData(student.id, normalizedData);

    // Se houver peso, registrar no histórico (lógica do serviço poderia ser usada aqui também)
    if (normalizedData.weight) {
      await db.weightHistory.create({
        data: {
          studentId: student.id,
          weight: normalizedData.weight,
          notes: "Peso inicial do onboarding",
        },
      }).catch(() => {}); // Ignorar erros silenciosamente
    }

    // Inicializar trial e progress via utilitários existentes
    await initializeStudentTrial(student.id);
    
    // Garantir que StudentProgress existe
    await db.studentProgress.upsert({
        where: { studentId: student.id },
        update: {},
        create: { studentId: student.id }
    });

    // Enviar email em background
    sendWelcomeEmail({ to: ctx.user.email, name: ctx.user.name }).catch(console.error);

    return { success: true };
  } catch (error: any) {
    console.error("Erro no onboarding:", error);
    return { success: false, error: error.message || "Erro ao salvar perfil" };
  }
}
