import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStudent } from "../middleware/auth.middleware";
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from "../utils/response.utils";
import {
  createUnitSchema,
  updateUnitSchema,
  createWorkoutSchema,
  updateWorkoutSchema,
  createWorkoutExerciseSchema,
  updateWorkoutExerciseSchema,
} from "../schemas/workouts.schemas";
import { exerciseDatabase } from "@/lib/educational-data";
import {
  generateAlternatives,
  calculateSets,
  calculateReps,
  calculateRest,
} from "@/lib/services/personalized-workout-generator";

// ==========================================
// UNITS
// ==========================================

export async function createUnitHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const body = await request.json();
    const validation = createUnitSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse("Dados inválidos", validation.error);
    }

    const { title, description } = validation.data;
    const studentId = auth.user.student.id;

    // Get max order
    const lastUnit = await db.unit.findFirst({
      where: { studentId },
      orderBy: { order: "desc" },
    });
    const order = lastUnit ? lastUnit.order + 1 : 0;

    const unit = await db.unit.create({
      data: {
        studentId,
        title,
        description,
        order,
      },
    });

    return successResponse(
      { data: unit, message: "Plano criado com sucesso" },
      201
    );
  } catch (error) {
    console.error("Error creating unit:", error);
    return internalErrorResponse("Erro ao criar plano de treino");
  }
}

export async function updateUnitHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const validation = updateUnitSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse("Dados inválidos", validation.error);
    }

    const unit = await db.unit.findUnique({
      where: { id },
    });

    if (!unit) return notFoundResponse("Plano não encontrado");

    if (unit.studentId !== auth.user.student.id) {
      return unauthorizedResponse(
        "Você não tem permissão para editar este plano"
      );
    }

    const updatedUnit = await db.unit.update({
      where: { id },
      data: validation.data,
    });

    return successResponse({
      data: updatedUnit,
      message: "Plano atualizado com sucesso",
    });
  } catch (error) {
    console.error("Error updating unit:", error);
    return internalErrorResponse("Erro ao atualizar plano");
  }
}

export async function deleteUnitHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const { id } = await params;

    const unit = await db.unit.findUnique({
      where: { id },
    });

    if (!unit) return notFoundResponse("Plano não encontrado");

    if (unit.studentId !== auth.user.student.id) {
      return unauthorizedResponse(
        "Você não tem permissão para excluir este plano"
      );
    }

    await db.unit.delete({
      where: { id },
    });

    return successResponse({ message: "Plano excluído com sucesso" });
  } catch (error) {
    console.error("Error deleting unit:", error);
    return internalErrorResponse("Erro ao excluir plano");
  }
}

// ==========================================
// WORKOUTS
// ==========================================

export async function createWorkoutHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const body = await request.json();
    const validation = createWorkoutSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse("Dados inválidos", validation.error);
    }

    const { unitId, ...workoutData } = validation.data;

    // Check if unit exists and belongs to student
    const unit = await db.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) return notFoundResponse("Plano não encontrado");

    if (unit.studentId !== auth.user.student.id) {
      return unauthorizedResponse(
        "Você não pode adicionar treinos a este plano"
      );
    }

    // Get max order in unit
    const lastWorkout = await db.workout.findFirst({
      where: { unitId },
      orderBy: { order: "desc" },
    });
    const order = lastWorkout ? lastWorkout.order + 1 : 0;

    // Garantir valores padrão se não fornecidos
    const workout = await db.workout.create({
      data: {
        unitId,
        order,
        ...workoutData,
        muscleGroup: workoutData.muscleGroup || "",
        estimatedTime: workoutData.estimatedTime || 0,
      },
    });

    return successResponse(
      { data: workout, message: "Treino criado com sucesso" },
      201
    );
  } catch (error) {
    console.error("Error creating workout:", error);
    return internalErrorResponse("Erro ao criar treino");
  }
}

export async function updateWorkoutHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const validation = updateWorkoutSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse("Dados inválidos", validation.error);
    }

    const workout = await db.workout.findUnique({
      where: { id },
      include: { unit: true },
    });

    if (!workout) return notFoundResponse("Treino não encontrado");

    if (!workout.unit) {
      return internalErrorResponse("Treino sem unidade vinculada");
    }

    if (workout.unit.studentId !== auth.user.student.id) {
      return unauthorizedResponse("Você não pode editar este treino");
    }

    const updatedWorkout = await db.workout.update({
      where: { id },
      data: validation.data,
    });

    return successResponse({
      data: updatedWorkout,
      message: "Treino atualizado com sucesso",
    });
  } catch (error) {
    console.error("Error updating workout:", error);
    return internalErrorResponse("Erro ao atualizar treino");
  }
}

export async function deleteWorkoutHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const { id } = await params;

    const workout = await db.workout.findUnique({
      where: { id },
      include: { unit: true },
    });

    if (!workout) return notFoundResponse("Treino não encontrado");

    if (!workout.unit) {
      return internalErrorResponse("Treino sem unidade vinculada");
    }

    if (workout.unit.studentId !== auth.user.student.id) {
      return unauthorizedResponse("Você não pode excluir este treino");
    }

    await db.workout.delete({
      where: { id },
    });

    return successResponse({ message: "Treino excluído com sucesso" });
  } catch (error) {
    console.error("Error deleting workout:", error);
    if ((error as any)?.code === "P2025") {
      return notFoundResponse("Treino não encontrado para exclusão");
    }
    return internalErrorResponse("Erro ao excluir treino");
  }
}

// ==========================================
// EXERCISES
// ==========================================

/**
 * Normaliza dados educacionais para formato do banco (JSON string)
 */
function normalizeEducationalData(data: any): any {
  const normalized: any = { ...data };

  // Campos que devem ser convertidos de array para JSON string
  const arrayFields = [
    "primaryMuscles",
    "secondaryMuscles",
    "equipment",
    "instructions",
    "tips",
    "commonMistakes",
    "benefits",
  ];

  for (const field of arrayFields) {
    if (normalized[field] !== undefined && normalized[field] !== null) {
      // Se já é string JSON, manter
      if (typeof normalized[field] === "string") {
        // Verificar se é JSON válido
        try {
          JSON.parse(normalized[field]);
          // Já é JSON válido, manter
        } catch {
          // Não é JSON válido, tratar como string simples
          normalized[field] = null;
        }
      } else if (Array.isArray(normalized[field])) {
        // Converter array para JSON string
        normalized[field] =
          normalized[field].length > 0
            ? JSON.stringify(normalized[field])
            : null;
      } else {
        // Tipo inválido, remover
        normalized[field] = null;
      }
    }
  }

  return normalized;
}

export async function createExerciseHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const body = await request.json();
    console.log(
      "[createExerciseHandler] Body recebido:",
      JSON.stringify(body, null, 2)
    );

    const validation = createWorkoutExerciseSchema.safeParse(body);

    if (!validation.success) {
      console.error("[createExerciseHandler] Erro de validação:", {
        body,
        errors: validation.error.errors,
        formattedErrors: validation.error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
          code: e.code,
        })),
      });
      return badRequestResponse(
        "Dados inválidos",
        validation.error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
          code: e.code,
        }))
      );
    }

    const { workoutId, ...exerciseData } = validation.data;

    // Check if workout exists and belongs to student
    const workout = await db.workout.findUnique({
      where: { id: workoutId },
      include: { unit: true },
    });

    if (!workout) return notFoundResponse("Treino não encontrado");

    if (!workout.unit) {
      return internalErrorResponse("Treino sem unidade vinculada");
    }

    if (workout.unit.studentId !== auth.user.student.id) {
      return unauthorizedResponse(
        "Você não pode adicionar exercícios a este treino"
      );
    }

    // Validar que educationalId foi fornecido
    if (!exerciseData.educationalId) {
      return badRequestResponse("ID educacional do exercício é obrigatório");
    }

    // Buscar perfil do aluno para calcular sets/reps/rest baseado nas preferências
    const student = await db.student.findUnique({
      where: { id: auth.user.student.id },
      include: { profile: true },
    });

    if (!student?.profile) {
      return badRequestResponse("Perfil do aluno não encontrado");
    }

    // Buscar exercício no database educacional (OBRIGATÓRIO)
    // Tentar buscar por ID exato primeiro
    let exerciseInfo = exerciseDatabase.find(
      (ex) => ex.id === exerciseData.educationalId
    );

    // Se não encontrou por ID exato, tentar buscar por nome (case-insensitive)
    if (!exerciseInfo) {
      const searchName = exerciseData.name || exerciseData.educationalId;
      exerciseInfo = exerciseDatabase.find(
        (ex) =>
          ex.name.toLowerCase() === searchName.toLowerCase() ||
          ex.id.toLowerCase() === exerciseData.educationalId.toLowerCase()
      );
    }

    if (!exerciseInfo) {
      console.error("[createExerciseHandler] Exercício não encontrado:", {
        educationalId: exerciseData.educationalId,
        name: exerciseData.name,
        availableIds: exerciseDatabase.slice(0, 5).map((ex) => ex.id), // Log primeiros 5 IDs para debug
      });
      return badRequestResponse(
        `Exercício não encontrado no database educacional: ${
          exerciseData.educationalId
        }. Nome buscado: ${exerciseData.name || "não fornecido"}`
      );
    }

    console.log("[createExerciseHandler] Exercício encontrado:", {
      id: exerciseInfo.id,
      name: exerciseInfo.name,
      educationalIdBuscado: exerciseData.educationalId,
    });

    // Calcular sets, reps e rest baseado nas preferências do aluno (igual ao generate)
    const profile: any = {
      preferredSets: student.profile.preferredSets || null,
      preferredRepRange: student.profile.preferredRepRange as
        | "forca"
        | "hipertrofia"
        | "resistencia"
        | null,
      restTime: student.profile.restTime as "curto" | "medio" | "longo" | null,
      activityLevel: student.profile.activityLevel,
      fitnessLevel: student.profile.fitnessLevel as
        | "iniciante"
        | "intermediario"
        | "avancado"
        | null,
      goals: student.profile.goals ? JSON.parse(student.profile.goals) : [],
    };

    // Calcular valores baseado nas preferências do aluno
    const calculatedSets =
      exerciseData.sets ||
      calculateSets(
        profile.preferredSets,
        profile.activityLevel,
        profile.fitnessLevel
      );
    const calculatedReps =
      exerciseData.reps ||
      calculateReps(profile.preferredRepRange, profile.goals);
    const calculatedRest =
      exerciseData.rest !== undefined
        ? exerciseData.rest
        : calculateRest(profile.restTime, profile.preferredRepRange);

    // Popular dados educacionais (igual ao generate)
    const educationalExerciseData = {
      name: exerciseData.name || exerciseInfo.name, // Usar nome fornecido ou do database
      sets: calculatedSets,
      reps: calculatedReps,
      rest: calculatedRest,
      primaryMuscles: exerciseInfo.primaryMuscles
        ? JSON.stringify(exerciseInfo.primaryMuscles)
        : null,
      secondaryMuscles: exerciseInfo.secondaryMuscles
        ? JSON.stringify(exerciseInfo.secondaryMuscles)
        : null,
      difficulty: exerciseInfo.difficulty || null,
      equipment:
        exerciseInfo.equipment && exerciseInfo.equipment.length > 0
          ? JSON.stringify(exerciseInfo.equipment)
          : null,
      instructions:
        exerciseInfo.instructions && exerciseInfo.instructions.length > 0
          ? JSON.stringify(exerciseInfo.instructions)
          : null,
      tips:
        exerciseInfo.tips && exerciseInfo.tips.length > 0
          ? JSON.stringify(exerciseInfo.tips)
          : null,
      commonMistakes:
        exerciseInfo.commonMistakes && exerciseInfo.commonMistakes.length > 0
          ? JSON.stringify(exerciseInfo.commonMistakes)
          : null,
      benefits:
        exerciseInfo.benefits && exerciseInfo.benefits.length > 0
          ? JSON.stringify(exerciseInfo.benefits)
          : null,
      scientificEvidence: exerciseInfo.scientificEvidence || null,
      educationalId: exerciseData.educationalId || exerciseInfo.id,
    };

    // Get max order in workout
    const lastExercise = await db.workoutExercise.findFirst({
      where: { workoutId },
      orderBy: { order: "desc" },
    });
    const order = lastExercise ? lastExercise.order + 1 : 0;

    // Criar exercício com todos os dados (educacionais + sets/reps/rest calculados)
    const exercise = await db.workoutExercise.create({
      data: {
        workoutId,
        ...educationalExerciseData, // Dados educacionais + sets/reps/rest calculados
        notes: exerciseData.notes || null,
        videoUrl: exerciseData.videoUrl || null,
        order,
      },
    });

    // Buscar alternativas para o exercício automaticamente
    // Isso garante que exercícios adicionados manualmente também tenham alternativas
    try {
      // Se já temos exerciseInfo (buscado acima) e perfil do aluno, gerar alternativas
      if (student?.profile && exerciseInfo) {
        // Preparar limitações (mesma lógica do gerador de workouts)
        const physicalLimitations = student.profile.physicalLimitations
          ? JSON.parse(student.profile.physicalLimitations)
          : [];
        const motorLimitations = student.profile.motorLimitations
          ? JSON.parse(student.profile.motorLimitations)
          : [];
        const medicalConditions = student.profile.medicalConditions
          ? JSON.parse(student.profile.medicalConditions)
          : [];
        const limitations = [
          ...physicalLimitations,
          ...motorLimitations,
          ...medicalConditions,
        ];

        // Gerar alternativas
        const alternatives = generateAlternatives(
          exerciseInfo,
          student.profile.gymType as
            | "academia-completa"
            | "academia-basica"
            | "home-gym"
            | "peso-corporal"
            | null,
          limitations
        );

        // Criar alternativas no banco de dados
        if (alternatives.length > 0) {
          await db.alternativeExercise.createMany({
            data: alternatives.map((alt, index) => ({
              workoutExerciseId: exercise.id,
              name: alt.name,
              reason: alt.reason,
              educationalId: alt.educationalId || null,
              order: index,
            })),
          });
        }
      }
    } catch (altError) {
      // Log erro mas não falhar a criação do exercício
      // As alternativas podem ser adicionadas depois através do endpoint PATCH /api/workouts/generate
      console.error(
        "[createExerciseHandler] Erro ao adicionar alternativas:",
        altError
      );
    }

    // Buscar exercício com alternativas para retornar completo
    const exerciseWithAlternatives = await db.workoutExercise.findUnique({
      where: { id: exercise.id },
      include: { alternatives: true },
    });

    // Transformar dados educacionais de JSON strings para arrays (igual ao generate)
    // Helper para parsear JSON com segurança
    const safeParse = (value: string | null | undefined): any => {
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };

    const transformedExercise = exerciseWithAlternatives
      ? {
          ...exerciseWithAlternatives,
          primaryMuscles: safeParse(exerciseWithAlternatives.primaryMuscles),
          secondaryMuscles: safeParse(
            exerciseWithAlternatives.secondaryMuscles
          ),
          equipment: safeParse(exerciseWithAlternatives.equipment),
          instructions: safeParse(exerciseWithAlternatives.instructions),
          tips: safeParse(exerciseWithAlternatives.tips),
          commonMistakes: safeParse(exerciseWithAlternatives.commonMistakes),
          benefits: safeParse(exerciseWithAlternatives.benefits),
          alternatives: exerciseWithAlternatives.alternatives || [],
        }
      : null;

    return successResponse(
      {
        data: transformedExercise,
        message: "Exercício adicionado com sucesso",
      },
      201
    );
  } catch (error) {
    console.error("Error creating exercise:", error);
    return internalErrorResponse("Erro ao adicionar exercício");
  }
}

export async function updateExerciseHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const validation = updateWorkoutExerciseSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse("Dados inválidos", validation.error);
    }

    const exercise = await db.workoutExercise.findUnique({
      where: { id },
      include: { workout: { include: { unit: true } } },
    });

    if (!exercise) return notFoundResponse("Exercício não encontrado");

    if (!exercise.workout?.unit) {
      return internalErrorResponse("Exercício sem treino ou unidade vinculada");
    }

    if (exercise.workout.unit.studentId !== auth.user.student.id) {
      return unauthorizedResponse("Você não pode editar este exercício");
    }

    // Normalizar dados educacionais (arrays → JSON strings)
    const normalizedData = normalizeEducationalData(validation.data);

    const updatedExercise = await db.workoutExercise.update({
      where: { id },
      data: normalizedData,
    });

    return successResponse({
      data: updatedExercise,
      message: "Exercício atualizado com sucesso",
    });
  } catch (error) {
    console.error("Error updating exercise:", error);
    return internalErrorResponse("Erro ao atualizar exercício");
  }
}

export async function deleteExerciseHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const { id } = await params;

    const exercise = await db.workoutExercise.findUnique({
      where: { id },
      include: { workout: { include: { unit: true } } },
    });

    if (!exercise) return notFoundResponse("Exercício não encontrado");

    // Verificar integridade dos dados
    if (!exercise.workout || !exercise.workout.unit) {
      console.error(
        "Inconsistência de dados: Exercício sem treino ou unidade vinculada",
        {
          exerciseId: id,
          workoutId: exercise.workoutId,
        }
      );
      return internalErrorResponse(
        "Erro de inconsistência de dados. Contate o suporte."
      );
    }

    // Allow if student owns the unit OR if we want to allow admins later (but for now strict ownership)
    // Note: If unit.studentId is null (global unit), student cannot delete exercises from it.
    // They should have cloned the unit first.
    const unit = exercise.workout.unit;
    if (unit.studentId !== auth.user.student.id) {
      // Additional check: maybe they are admin? For now, just block.
      // If studentId is null, this check correctly fails (null !== id).
      return unauthorizedResponse("Você não pode excluir este exercício");
    }

    await db.workoutExercise.delete({
      where: { id },
    });

    return successResponse({ message: "Exercício excluído com sucesso" });
  } catch (error) {
    console.error("Error deleting exercise:", error);
    // Verificar se é erro de Prisma (ex: registro não existe ou constraint)
    if ((error as any).code === "P2025") {
      return notFoundResponse("Exercício não encontrado para exclusão");
    }
    return internalErrorResponse("Erro ao excluir exercício");
  }
}
