"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/services/email.service";
import { initializeStudentTrial } from "@/lib/utils/auto-trial";
import { getSession } from "@/lib/utils/session";
import { validateOnboarding } from "./schemas";
import type { OnboardingData } from "./steps/types";

/** Dados aplicados antes da validação para onboarding simplificado (3 etapas) */
export const ONBOARDING_DEFAULTS = {
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

    const cookieStore = await cookies();
    // Verificar ambos os cookies: auth_token (legacy) e better-auth.session_token (Better Auth)
    const sessionToken =
      cookieStore.get("auth_token")?.value ||
      cookieStore.get("better-auth.session_token")?.value;

    if (!sessionToken) {
      return { success: false, error: "Não autenticado" };
    }

    // Primeiro tentar validar via Better Auth (prioridade)
    let userId: string | null = null;

    try {
      const { auth } = await import("@/lib/auth-config");

      // Em server actions, precisamos construir os headers manualmente
      // Pegar todos os cookies e construir string de cookie
      const allCookies = cookieStore.getAll();
      const cookieString = allCookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");

      const betterAuthHeaders = new Headers();
      if (cookieString) {
        betterAuthHeaders.set("cookie", cookieString);
      }

      const betterAuthSession = await auth.api.getSession({
        headers: betterAuthHeaders,
      });

      if (betterAuthSession?.user) {
        // Sessão do Better Auth encontrada - usar userId diretamente
        userId = betterAuthSession.user.id;
        console.log(
          "[submitOnboarding] Sessão validada via Better Auth, userId:",
          userId,
        );
      }
    } catch (betterAuthError) {
      // Se falhar com Better Auth, tentar método antigo
      console.log(
        "[submitOnboarding] Better Auth não encontrou sessão, tentando método antigo:",
        betterAuthError,
      );
    }

    // Fallback: tentar buscar sessão no banco usando o token
    if (!userId) {
      const session = await getSession(sessionToken);
      if (session) {
        userId = session.userId;
        console.log(
          "[submitOnboarding] Sessão encontrada no banco, userId:",
          userId,
        );
      }
    }

    if (!userId) {
      console.error(
        "[submitOnboarding] Nenhuma sessão válida encontrada. Token:",
        `${sessionToken?.substring(0, 20)}...`,
      );
      return { success: false, error: "Sessão inválida" };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { student: true },
    });

    if (!user) {
      return { success: false, error: "Usuário não encontrado" };
    }

    if (user.role !== "STUDENT") {
      return { success: false, error: "Usuário não é um aluno" };
    }

    let student = user.student;
    if (!student) {
      student = await db.student.create({
        data: {
          userId,
          age:
            typeof normalizedData.age === "number" ? normalizedData.age : null,
          gender: normalizedData.gender || null,
          isTrans: normalizedData.isTrans || false,
          usesHormones: normalizedData.usesHormones || false,
          hormoneType: normalizedData.hormoneType || null,
        },
      });
    } else {
      student = await db.student.update({
        where: { id: student.id },
        data: {
          age:
            typeof normalizedData.age === "number" ? normalizedData.age : null,
          gender: normalizedData.gender || null,
          isTrans: normalizedData.isTrans || false,
          usesHormones: normalizedData.usesHormones || false,
          hormoneType: normalizedData.hormoneType || null,
        },
      });
    }

    const profileData = {
      studentId: student.id,
      height:
        normalizedData.height && typeof normalizedData.height === "number"
          ? normalizedData.height
          : null,
      weight:
        normalizedData.weight && typeof normalizedData.weight === "number"
          ? normalizedData.weight
          : null,
      fitnessLevel: normalizedData.fitnessLevel || null,
      weeklyWorkoutFrequency: normalizedData.weeklyWorkoutFrequency || null,
      workoutDuration: normalizedData.workoutDuration || null,
      goals:
        normalizedData.goals.length > 0
          ? JSON.stringify(normalizedData.goals)
          : null,
      gymType: normalizedData.gymType || null,
      preferredSets: normalizedData.preferredSets ?? null,
      preferredRepRange: normalizedData.preferredRepRange || null,
      restTime: normalizedData.restTime || null,
      targetCalories:
        normalizedData.targetCalories &&
        typeof normalizedData.targetCalories === "number"
          ? normalizedData.targetCalories
          : null,
      targetProtein:
        normalizedData.targetProtein &&
        typeof normalizedData.targetProtein === "number"
          ? normalizedData.targetProtein
          : null,
      targetCarbs:
        normalizedData.targetCarbs &&
        typeof normalizedData.targetCarbs === "number"
          ? normalizedData.targetCarbs
          : null,
      targetFats:
        normalizedData.targetFats &&
        typeof normalizedData.targetFats === "number"
          ? normalizedData.targetFats
          : null,
      bmr:
        normalizedData.bmr && typeof normalizedData.bmr === "number"
          ? normalizedData.bmr
          : null,
      tdee:
        normalizedData.tdee && typeof normalizedData.tdee === "number"
          ? normalizedData.tdee
          : null,
      activityLevel:
        normalizedData.activityLevel &&
        typeof normalizedData.activityLevel === "number"
          ? normalizedData.activityLevel
          : null,
      hormoneTreatmentDuration:
        normalizedData.hormoneTreatmentDuration &&
        typeof normalizedData.hormoneTreatmentDuration === "number"
          ? normalizedData.hormoneTreatmentDuration
          : null,
      physicalLimitations:
        normalizedData.physicalLimitations &&
        normalizedData.physicalLimitations.length > 0
          ? JSON.stringify(normalizedData.physicalLimitations)
          : null,
      motorLimitations:
        normalizedData.motorLimitations &&
        normalizedData.motorLimitations.length > 0
          ? JSON.stringify(normalizedData.motorLimitations)
          : null,
      medicalConditions:
        normalizedData.medicalConditions &&
        normalizedData.medicalConditions.length > 0
          ? JSON.stringify(normalizedData.medicalConditions)
          : null,
      limitationDetails:
        normalizedData.limitationDetails &&
        Object.keys(normalizedData.limitationDetails).length > 0
          ? JSON.stringify(normalizedData.limitationDetails)
          : null,
      dailyAvailableHours:
        normalizedData.dailyAvailableHours &&
        typeof normalizedData.dailyAvailableHours === "number"
          ? normalizedData.dailyAvailableHours
          : null,
      injuries:
        (normalizedData.physicalLimitations?.length ?? 0) > 0 ||
        (normalizedData.motorLimitations?.length ?? 0) > 0 ||
        (normalizedData.medicalConditions?.length ?? 0) > 0
          ? JSON.stringify([
              ...(normalizedData.physicalLimitations || []),
              ...(normalizedData.motorLimitations || []),
              ...(normalizedData.medicalConditions || []),
            ])
          : null,
    };

    await db.studentProfile.upsert({
      where: { studentId: student.id },
      create: profileData,
      update: profileData,
    });

    // Se houver peso no perfil, criar registro inicial no weightHistory (se não existir)
    if (profileData.weight && typeof profileData.weight === "number") {
      try {
        // Verificar se já existe algum registro de peso
        const existingWeightHistory = await db.weightHistory.findFirst({
          where: { studentId: student.id },
        });

        // Se não existir, criar registro inicial com o peso do onboarding
        if (!existingWeightHistory) {
          await db.weightHistory.create({
            data: {
              studentId: student.id,
              weight: profileData.weight,
              date: new Date(),
              notes: "Peso inicial do onboarding",
            },
          });
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "";
        // Se a tabela não existir ainda, ignorar (migration não aplicada)
        if (!msg.includes("does not exist") && !msg.includes("Unknown table")) {
          console.error("Erro ao criar registro inicial de peso:", error);
        }
      }
    }

    // Verificar se já existe progresso, se não, criar
    const existingProgress = await db.studentProgress.findUnique({
      where: { studentId: student.id },
    });

    if (!existingProgress) {
      await db.studentProgress.create({
        data: {
          studentId: student.id,
        },
      });
    }

    // Inicializar trial de 14 dias automaticamente
    await initializeStudentTrial(student.id);

    // Enviar email de boas-vindas (em background, não bloqueia)
    sendWelcomeEmail({
      to: user.email,
      name: user.name,
    }).catch((error) => {
      console.error("Erro ao enviar email de boas-vindas:", error);
    });

    // ⚠️ MUDANÇA: Não gerar treinos automaticamente no onboarding
    // O usuário agora cria seus próprios treinos na página /student/learn
    // Removida a geração automática de treinos personalizados
    // A página /student/learn mostrará um empty state com opção para criar primeiro treino

    return { success: true };
  } catch (error: unknown) {
    console.error("Erro ao salvar perfil:", error);
    const msg =
      error instanceof Error ? error.message : "Erro ao salvar perfil";
    return { success: false, error: msg };
  }
}
