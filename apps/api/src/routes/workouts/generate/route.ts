import { requireStudent } from "@/lib/api/middleware/auth.middleware";
import {
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import {
  generatePersonalizedWorkoutPlan,
  updateExercisesWithAlternatives,
} from "@/lib/services/personalized-workout-generator";
import { parseJsonArray, parseJsonSafe } from "@/lib/utils/json";
import { type NextRequest, NextResponse } from "@/runtime/next-server";

/**
 * POST /api/workouts/generate
 * Gera treinos personalizados para o aluno baseado em seus dados do onboarding
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student.id;
    const _userId = auth.user.id;

    // Buscar dados do perfil do aluno
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        profile: true,
      },
    });

    if (!student || !student.profile) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Perfil do aluno não encontrado. Complete o onboarding primeiro.",
        },
        { status: 404 },
      );
    }

    // Verificar se já existem treinos personalizados para este aluno
    const existingUnits = await db.unit.count({
      where: { studentId: studentId },
    });
    if (existingUnits > 0) {
      // Deletar apenas os treinos antigos DESTE aluno para gerar novos
      await db.unit.deleteMany({
        where: { studentId: studentId },
      });
    }

    // Preparar dados do perfil (incluindo preferências do onboarding)
    const profile = {
      age: student.age,
      gender: student.gender,
      fitnessLevel: student.profile.fitnessLevel as
        | "iniciante"
        | "intermediario"
        | "avancado"
        | null,
      height: student.profile.height,
      weight: student.profile.weight,
      goals: parseJsonArray<string>(student.profile.goals),
      weeklyWorkoutFrequency: student.profile.weeklyWorkoutFrequency,
      workoutDuration: student.profile.workoutDuration,
      // Preferências do onboarding (ESSENCIAIS para sets, reps e rest)
      preferredSets: student.profile.preferredSets || null,
      preferredRepRange: student.profile.preferredRepRange as
        | "forca"
        | "hipertrofia"
        | "resistencia"
        | null,
      restTime: student.profile.restTime as "curto" | "medio" | "longo" | null,
      gymType: student.profile.gymType as
        | "academia-completa"
        | "academia-basica"
        | "home-gym"
        | "peso-corporal"
        | null,
      activityLevel: student.profile.activityLevel,
      physicalLimitations: parseJsonArray<string>(
        student.profile.physicalLimitations,
      ),
      motorLimitations: parseJsonArray<string>(student.profile.motorLimitations),
      medicalConditions: parseJsonArray<string>(
        student.profile.medicalConditions,
      ),
      limitationDetails: parseJsonSafe<Record<string, string | string[]>>(
        student.profile.limitationDetails,
      ),
    };

    // Gerar treinos personalizados
    await generatePersonalizedWorkoutPlan(studentId, profile);

    // Atualizar exercícios com alternativas (garantir que todos tenham alternativas)
    await updateExercisesWithAlternatives(studentId);

    // Popular exercícios com dados educacionais (músculos, instruções, dicas, etc)
    // IMPORTANTE: Passar studentId para atualizar apenas exercícios deste aluno
    const { populateWorkoutExercisesWithEducationalData } = await import(
      "@/lib/services/populate-workout-exercises-educational-data"
    );
    await populateWorkoutExercisesWithEducationalData(studentId);

    return successResponse({
      message: "Treinos personalizados gerados com sucesso",
    });
  } catch (error) {
    log.error("[generateWorkouts] Erro", { error });
    return internalErrorResponse("Erro ao gerar treinos personalizados", error);
  }
}

/**
 * PATCH /api/workouts/generate
 * Atualiza exercícios existentes com alternativas
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student.id;

    await updateExercisesWithAlternatives(studentId);

    return successResponse({
      message: "Alternativas adicionadas aos exercícios com sucesso!",
    });
  } catch (error) {
    log.error("[PATCH /api/workouts/generate] Erro", { error });
    return internalErrorResponse("Erro ao atualizar alternativas", error);
  }
}
