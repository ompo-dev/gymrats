"use server";

import { cookies } from "next/headers";
import { getSession } from "@/lib/utils/session";
import { db } from "@/lib/db";
import { initializeStudentTrial } from "@/lib/utils/auto-trial";
import type { OnboardingData } from "./steps/types";
import { validateOnboarding } from "./schemas";
import { sendWelcomeEmail } from "@/lib/services/email.service";

export async function submitOnboarding(formData: OnboardingData) {
  try {
    // Valida dados com Zod antes de processar
    const validation = validateOnboarding({
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
      preferredSets: formData.preferredSets,
      preferredRepRange: formData.preferredRepRange,
      restTime: formData.restTime,
      targetCalories: formData.targetCalories,
      targetProtein: formData.targetProtein,
      targetCarbs: formData.targetCarbs,
      targetFats: formData.targetFats,
      activityLevel:
        typeof formData.activityLevel === "number"
          ? formData.activityLevel
          : undefined,
      hormoneTreatmentDuration:
        typeof formData.hormoneTreatmentDuration === "number"
          ? formData.hormoneTreatmentDuration
          : undefined,
      physicalLimitations: formData.physicalLimitations || [],
      motorLimitations: formData.motorLimitations || [],
      medicalConditions: formData.medicalConditions || [],
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
          userId
        );
      }
    } catch (betterAuthError) {
      // Se falhar com Better Auth, tentar método antigo
      console.log(
        "[submitOnboarding] Better Auth não encontrou sessão, tentando método antigo:",
        betterAuthError
      );
    }

    // Fallback: tentar buscar sessão no banco usando o token
    if (!userId) {
      const session = await getSession(sessionToken);
      if (session) {
        userId = session.userId;
        console.log(
          "[submitOnboarding] Sessão encontrada no banco, userId:",
          userId
        );
      }
    }

    if (!userId) {
      console.error(
        "[submitOnboarding] Nenhuma sessão válida encontrada. Token:",
        sessionToken?.substring(0, 20) + "..."
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
          age: typeof formData.age === "number" ? formData.age : null,
          gender: formData.gender || null,
          // Informações sobre identidade de gênero e terapia hormonal
          isTrans: formData.isTrans || false,
          usesHormones: formData.usesHormones || false,
          hormoneType: formData.hormoneType || null,
        },
      });
    } else {
      student = await db.student.update({
        where: { id: student.id },
        data: {
          age: typeof formData.age === "number" ? formData.age : null,
          gender: formData.gender || null,
          // Informações sobre identidade de gênero e terapia hormonal
          isTrans: formData.isTrans || false,
          usesHormones: formData.usesHormones || false,
          hormoneType: formData.hormoneType || null,
        },
      });
    }

    const profileData = {
      studentId: student.id,
      height:
        formData.height && typeof formData.height === "number"
          ? formData.height
          : null,
      weight:
        formData.weight && typeof formData.weight === "number"
          ? formData.weight
          : null,
      fitnessLevel: formData.fitnessLevel || null,
      weeklyWorkoutFrequency: formData.weeklyWorkoutFrequency || null,
      workoutDuration: formData.workoutDuration || null,
      goals: formData.goals.length > 0 ? JSON.stringify(formData.goals) : null,
      gymType: formData.gymType || null,
      preferredSets: formData.preferredSets || null,
      preferredRepRange: formData.preferredRepRange || null,
      restTime: formData.restTime || null,
      // Valores metabólicos calculados
      targetCalories:
        formData.targetCalories && typeof formData.targetCalories === "number"
          ? formData.targetCalories
          : null,
      targetProtein:
        formData.targetProtein && typeof formData.targetProtein === "number"
          ? formData.targetProtein
          : null,
      targetCarbs:
        formData.targetCarbs && typeof formData.targetCarbs === "number"
          ? formData.targetCarbs
          : null,
      targetFats:
        formData.targetFats && typeof formData.targetFats === "number"
          ? formData.targetFats
          : null,
      // Valores metabólicos calculados
      bmr:
        formData.bmr && typeof formData.bmr === "number" ? formData.bmr : null,
      tdee:
        formData.tdee && typeof formData.tdee === "number"
          ? formData.tdee
          : null,
      // Nível de atividade física (1-10)
      activityLevel:
        formData.activityLevel && typeof formData.activityLevel === "number"
          ? formData.activityLevel
          : null,
      // Tempo de tratamento hormonal (meses)
      hormoneTreatmentDuration:
        formData.hormoneTreatmentDuration &&
        typeof formData.hormoneTreatmentDuration === "number"
          ? formData.hormoneTreatmentDuration
          : null,
      // Limitações separadas
      physicalLimitations:
        formData.physicalLimitations && formData.physicalLimitations.length > 0
          ? JSON.stringify(formData.physicalLimitations)
          : null,
      motorLimitations:
        formData.motorLimitations && formData.motorLimitations.length > 0
          ? JSON.stringify(formData.motorLimitations)
          : null,
      medicalConditions:
        formData.medicalConditions && formData.medicalConditions.length > 0
          ? JSON.stringify(formData.medicalConditions)
          : null,
      // Detalhes das limitações
      limitationDetails:
        formData.limitationDetails &&
        Object.keys(formData.limitationDetails).length > 0
          ? JSON.stringify(formData.limitationDetails)
          : null,
      // Horas disponíveis por dia para treino (para planejamento de treino mensal)
      dailyAvailableHours:
        formData.dailyAvailableHours &&
        typeof formData.dailyAvailableHours === "number"
          ? formData.dailyAvailableHours
          : null,
      // Manter compatibilidade: também salvar no campo injuries (JSON array combinado)
      injuries:
        (formData.physicalLimitations?.length ?? 0) > 0 ||
        (formData.motorLimitations?.length ?? 0) > 0 ||
        (formData.medicalConditions?.length ?? 0) > 0
          ? JSON.stringify([
              ...(formData.physicalLimitations || []),
              ...(formData.motorLimitations || []),
              ...(formData.medicalConditions || []),
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
      } catch (error: any) {
        // Se a tabela não existir ainda, ignorar (migration não aplicada)
        if (
          !error.message?.includes("does not exist") &&
          !error.message?.includes("Unknown table")
        ) {
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

    // Gerar treinos personalizados em background (fire and forget)
    // Não bloqueia o retorno do onboarding
    (async () => {
      try {
        const {
          generatePersonalizedWorkoutPlan,
          updateExercisesWithAlternatives,
        } = await import("@/lib/services/personalized-workout-generator");

        const { populateWorkoutExercisesWithEducationalData } = await import(
          "@/lib/services/populate-workout-exercises-educational-data"
        );

        // Preparar dados do perfil para geração de treinos (usando dados já salvos no banco)
        const workoutProfile: any = {
          age: student.age,
          gender: student.gender,
          fitnessLevel: formData.fitnessLevel as
            | "iniciante"
            | "intermediario"
            | "avancado"
            | null,
          height: typeof formData.height === "number" ? formData.height : null,
          weight: typeof formData.weight === "number" ? formData.weight : null,
          goals: formData.goals || [],
          weeklyWorkoutFrequency: formData.weeklyWorkoutFrequency || null,
          workoutDuration: formData.workoutDuration || null,
          preferredSets:
            typeof formData.preferredSets === "number"
              ? formData.preferredSets
              : null,
          preferredRepRange: formData.preferredRepRange || null,
          restTime: formData.restTime || null,
          gymType: formData.gymType || null,
          activityLevel:
            typeof formData.activityLevel === "number"
              ? formData.activityLevel
              : null,
          physicalLimitations: formData.physicalLimitations || [],
          motorLimitations: formData.motorLimitations || [],
          medicalConditions: formData.medicalConditions || [],
          limitationDetails: formData.limitationDetails || null,
        };

        console.log(
          `[submitOnboarding] Iniciando geração de treinos para student ${student.id}`
        );

        // Gerar treinos personalizados (gera 4 semanas de treinos)
        await generatePersonalizedWorkoutPlan(student.id, workoutProfile);
        console.log(
          `[submitOnboarding] Treinos gerados para student ${student.id}`
        );

        // Atualizar exercícios com alternativas
        await updateExercisesWithAlternatives(student.id);
        console.log(
          `[submitOnboarding] Alternativas atualizadas para student ${student.id}`
        );

        // Popular exercícios com dados educacionais
        await populateWorkoutExercisesWithEducationalData(student.id);
        console.log(
          `[submitOnboarding] Dados educacionais populados para student ${student.id}`
        );

        console.log(
          `[submitOnboarding] ✅ Treinos personalizados gerados com sucesso para student ${student.id}`
        );
      } catch (workoutError: any) {
        // Não falhar o onboarding se a geração de treinos falhar
        console.error(
          "[submitOnboarding] ❌ Erro ao gerar treinos personalizados:",
          workoutError
        );
        console.error("[submitOnboarding] Stack trace:", workoutError.stack);
      }
    })();

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao salvar perfil:", error);
    return { success: false, error: error.message || "Erro ao salvar perfil" };
  }
}
