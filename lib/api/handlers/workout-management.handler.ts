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

    const workout = await db.workout.create({
      data: {
        unitId,
        ...workoutData,
        order,
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
    const validation = createWorkoutExerciseSchema.safeParse(body);

    if (!validation.success) {
      return badRequestResponse("Dados inválidos", validation.error);
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

    // Get max order in workout
    const lastExercise = await db.workoutExercise.findFirst({
      where: { workoutId },
      orderBy: { order: "desc" },
    });
    const order = lastExercise ? lastExercise.order + 1 : 0;

    // Normalizar dados educacionais (arrays → JSON strings)
    const normalizedData = normalizeEducationalData(exerciseData);

    const exercise = await db.workoutExercise.create({
      data: {
        workoutId,
        ...normalizedData,
        order,
      },
    });

    return successResponse(
      { data: exercise, message: "Exercício adicionado com sucesso" },
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
