import { db } from "@/lib/db";
import type { Context } from "elysia";
import {
  createUnitSchema,
  updateUnitSchema,
  createWorkoutSchema,
  updateWorkoutSchema,
  createWorkoutExerciseSchema,
  updateWorkoutExerciseSchema,
} from "@gymrats/contracts";
import { exerciseDatabase } from "@/lib/educational-data";
import type { ExerciseInfo } from "@/lib/types";
import {
  generateAlternatives,
  calculateSets,
  calculateReps,
  calculateRest,
} from "@/lib/services/personalized-workout-generator";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "../utils/response";

type WorkoutMgmtContext = {
  set: Context["set"];
  body?: unknown;
  studentId: string;
  params?: Record<string, string>;
};

export async function createUnitHandler({
  set,
  body,
  studentId,
}: WorkoutMgmtContext) {
  try {
    const validation = createUnitSchema.safeParse(body);
    if (!validation.success) {
      return badRequestResponse(set, "Dados inválidos", validation.error);
    }

    const { title, description } = validation.data;
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
      set,
      { data: unit, message: "Plano criado com sucesso" },
      201
    );
  } catch (error) {
    console.error("Error creating unit:", error);
    return internalErrorResponse(set, "Erro ao criar plano de treino", error);
  }
}

export async function updateUnitHandler({
  set,
  body,
  studentId,
  params,
}: WorkoutMgmtContext) {
  try {
    const id = params?.id;
    if (!id) {
      return badRequestResponse(set, "ID do plano é obrigatório");
    }

    const validation = updateUnitSchema.safeParse(body);
    if (!validation.success) {
      return badRequestResponse(set, "Dados inválidos", validation.error);
    }

    const unit = await db.unit.findUnique({ where: { id } });
    if (!unit) return notFoundResponse(set, "Plano não encontrado");

    if (unit.studentId !== studentId) {
      return unauthorizedResponse(
        set,
        "Você não tem permissão para editar este plano"
      );
    }

    const updatedUnit = await db.unit.update({
      where: { id },
      data: validation.data,
    });

    return successResponse(set, {
      data: updatedUnit,
      message: "Plano atualizado com sucesso",
    });
  } catch (error) {
    console.error("Error updating unit:", error);
    return internalErrorResponse(set, "Erro ao atualizar plano", error);
  }
}

export async function deleteUnitHandler({
  set,
  studentId,
  params,
}: WorkoutMgmtContext) {
  try {
    const id = params?.id;
    if (!id) {
      return badRequestResponse(set, "ID do plano é obrigatório");
    }

    const unit = await db.unit.findUnique({
      where: { id },
      include: { workouts: true },
    });

    if (!unit) return notFoundResponse(set, "Plano não encontrado");
    if (unit.studentId !== studentId) {
      return unauthorizedResponse(
        set,
        "Você não tem permissão para deletar este plano"
      );
    }

    if (unit.workouts.length > 0) {
      await db.workout.deleteMany({
        where: { unitId: unit.id },
      });
    }

    await db.unit.delete({ where: { id } });
    return successResponse(set, { message: "Plano deletado com sucesso" });
  } catch (error) {
    console.error("Error deleting unit:", error);
    return internalErrorResponse(set, "Erro ao deletar plano", error);
  }
}

export async function createWorkoutHandler({
  set,
  body,
  studentId,
}: WorkoutMgmtContext) {
  try {
    const validation = createWorkoutSchema.safeParse(body);
    if (!validation.success) {
      return badRequestResponse(set, "Dados inválidos", validation.error);
    }

    const { unitId } = validation.data;
    const unit = await db.unit.findUnique({ where: { id: unitId } });

    if (!unit) return notFoundResponse(set, "Plano não encontrado");
    if (unit.studentId !== studentId) {
      return unauthorizedResponse(
        set,
        "Você não tem permissão para criar treino neste plano"
      );
    }

    const lastWorkout = await db.workout.findFirst({
      where: { unitId },
      orderBy: { order: "desc" },
    });
    const order = lastWorkout ? lastWorkout.order + 1 : 0;

    const workout = await db.workout.create({
      data: {
        ...validation.data,
        order,
      },
    });

    return successResponse(
      set,
      { data: workout, message: "Treino criado com sucesso" },
      201
    );
  } catch (error) {
    console.error("Error creating workout:", error);
    return internalErrorResponse(set, "Erro ao criar treino", error);
  }
}

export async function updateWorkoutHandler({
  set,
  body,
  studentId,
  params,
}: WorkoutMgmtContext) {
  try {
    const id = params?.id;
    if (!id) {
      return badRequestResponse(set, "ID do treino é obrigatório");
    }

    const validation = updateWorkoutSchema.safeParse(body);
    if (!validation.success) {
      return badRequestResponse(set, "Dados inválidos", validation.error);
    }

    const workout = await db.workout.findUnique({
      where: { id },
      include: { unit: true },
    });

    if (!workout) return notFoundResponse(set, "Treino não encontrado");
    if (workout.unit?.studentId !== studentId) {
      return unauthorizedResponse(
        set,
        "Você não tem permissão para editar este treino"
      );
    }

    const updatedWorkout = await db.workout.update({
      where: { id },
      data: validation.data,
    });

    return successResponse(set, {
      data: updatedWorkout,
      message: "Treino atualizado com sucesso",
    });
  } catch (error) {
    console.error("Error updating workout:", error);
    return internalErrorResponse(set, "Erro ao atualizar treino", error);
  }
}

export async function deleteWorkoutHandler({
  set,
  studentId,
  params,
}: WorkoutMgmtContext) {
  try {
    const id = params?.id;
    if (!id) {
      return badRequestResponse(set, "ID do treino é obrigatório");
    }

    const workout = await db.workout.findUnique({
      where: { id },
      include: { unit: true },
    });

    if (!workout) return notFoundResponse(set, "Treino não encontrado");
    if (workout.unit?.studentId !== studentId) {
      return unauthorizedResponse(
        set,
        "Você não tem permissão para deletar este treino"
      );
    }

    await db.workoutExercise.deleteMany({ where: { workoutId: id } });
    await db.workout.delete({ where: { id } });

    return successResponse(set, { message: "Treino deletado com sucesso" });
  } catch (error) {
    console.error("Error deleting workout:", error);
    return internalErrorResponse(set, "Erro ao deletar treino", error);
  }
}

export async function createExerciseHandler({
  set,
  body,
  studentId,
}: WorkoutMgmtContext) {
  try {
    const validation = createWorkoutExerciseSchema.safeParse(body);
    if (!validation.success) {
      return badRequestResponse(set, "Dados inválidos", validation.error);
    }

    const { workoutId, name, sets, reps, rest, notes, educationalId } =
      validation.data;

    const workout = await db.workout.findUnique({
      where: { id: workoutId },
      include: { unit: true },
    });

    if (!workout) return notFoundResponse(set, "Treino não encontrado");
    if (workout.unit?.studentId !== studentId) {
      return unauthorizedResponse(
        set,
        "Você não tem permissão para criar exercícios neste treino"
      );
    }

    const lastExercise = await db.workoutExercise.findFirst({
      where: { workoutId },
      orderBy: { order: "desc" },
    });
    const order = lastExercise ? lastExercise.order + 1 : 0;

    const exerciseInfo = getExerciseInfo(name, educationalId);

    const normalizedSets = sets ?? 3;
    const normalizedReps = reps ?? "8-12";
    const normalizedRest = rest ?? 60;

    const exercise = await db.workoutExercise.create({
      data: {
        workoutId,
        name,
        sets: normalizedSets,
        reps: normalizedReps,
        rest: normalizedRest,
        notes,
        educationalId: exerciseInfo?.id || educationalId || null,
        order,
        primaryMuscles: exerciseInfo?.primaryMuscles?.length
          ? JSON.stringify(exerciseInfo.primaryMuscles)
          : null,
        secondaryMuscles: exerciseInfo?.secondaryMuscles?.length
          ? JSON.stringify(exerciseInfo.secondaryMuscles)
          : null,
        difficulty: exerciseInfo?.difficulty || null,
        equipment: exerciseInfo?.equipment?.length
          ? JSON.stringify(exerciseInfo.equipment)
          : null,
        instructions: exerciseInfo?.instructions?.length
          ? JSON.stringify(exerciseInfo.instructions)
          : null,
        tips: exerciseInfo?.tips?.length ? JSON.stringify(exerciseInfo.tips) : null,
        commonMistakes: exerciseInfo?.commonMistakes?.length
          ? JSON.stringify(exerciseInfo.commonMistakes)
          : null,
        benefits: exerciseInfo?.benefits?.length
          ? JSON.stringify(exerciseInfo.benefits)
          : null,
        scientificEvidence: exerciseInfo?.scientificEvidence || null,
      },
    });

    return successResponse(
      set,
      { data: exercise, message: "Exercício criado com sucesso" },
      201
    );
  } catch (error) {
    console.error("Error creating exercise:", error);
    return internalErrorResponse(set, "Erro ao criar exercício", error);
  }
}

export async function updateExerciseHandler({
  set,
  body,
  studentId,
  params,
}: WorkoutMgmtContext) {
  try {
    const id = params?.id;
    if (!id) {
      return badRequestResponse(set, "ID do exercício é obrigatório");
    }

    const validation = updateWorkoutExerciseSchema.safeParse(body);
    if (!validation.success) {
      return badRequestResponse(set, "Dados inválidos", validation.error);
    }

    const exercise = await db.workoutExercise.findUnique({
      where: { id },
      include: { workout: { include: { unit: true } } },
    });

    if (!exercise) return notFoundResponse(set, "Exercício não encontrado");
    if (exercise.workout.unit?.studentId !== studentId) {
      return unauthorizedResponse(
        set,
        "Você não tem permissão para editar este exercício"
      );
    }

    const exerciseName = validation.data.name ?? exercise.name;
    const exerciseInfo = getExerciseInfo(
      exerciseName,
      validation.data.educationalId || undefined
    );

    const updatedExercise = await db.workoutExercise.update({
      where: { id },
      data: {
        ...validation.data,
        name: exerciseName,
        primaryMuscles: exerciseInfo?.primaryMuscles?.length
          ? JSON.stringify(exerciseInfo.primaryMuscles)
          : exercise.primaryMuscles,
        secondaryMuscles: exerciseInfo?.secondaryMuscles?.length
          ? JSON.stringify(exerciseInfo.secondaryMuscles)
          : exercise.secondaryMuscles,
        difficulty: exerciseInfo?.difficulty || exercise.difficulty,
        equipment: exerciseInfo?.equipment?.length
          ? JSON.stringify(exerciseInfo.equipment)
          : exercise.equipment,
        instructions: exerciseInfo?.instructions?.length
          ? JSON.stringify(exerciseInfo.instructions)
          : exercise.instructions,
        tips: exerciseInfo?.tips?.length
          ? JSON.stringify(exerciseInfo.tips)
          : exercise.tips,
        commonMistakes: exerciseInfo?.commonMistakes?.length
          ? JSON.stringify(exerciseInfo.commonMistakes)
          : exercise.commonMistakes,
        benefits: exerciseInfo?.benefits?.length
          ? JSON.stringify(exerciseInfo.benefits)
          : exercise.benefits,
        scientificEvidence:
          exerciseInfo?.scientificEvidence || exercise.scientificEvidence,
      },
    });

    return successResponse(set, {
      data: updatedExercise,
      message: "Exercício atualizado com sucesso",
    });
  } catch (error) {
    console.error("Error updating exercise:", error);
    return internalErrorResponse(set, "Erro ao atualizar exercício", error);
  }
}

export async function deleteExerciseHandler({
  set,
  studentId,
  params,
}: WorkoutMgmtContext) {
  try {
    const id = params?.id;
    if (!id) {
      return badRequestResponse(set, "ID do exercício é obrigatório");
    }

    const exercise = await db.workoutExercise.findUnique({
      where: { id },
      include: { workout: { include: { unit: true } } },
    });

    if (!exercise) return notFoundResponse(set, "Exercício não encontrado");
    if (exercise.workout.unit?.studentId !== studentId) {
      return unauthorizedResponse(
        set,
        "Você não tem permissão para deletar este exercício"
      );
    }

    await db.workoutExercise.delete({ where: { id } });
    await db.alternativeExercise.deleteMany({
      where: { workoutExerciseId: id },
    });

    return successResponse(set, { message: "Exercício deletado com sucesso" });
  } catch (error) {
    console.error("Error deleting exercise:", error);
    return internalErrorResponse(set, "Erro ao deletar exercício", error);
  }
}

function getExerciseInfo(name: string, educationalId?: string | null) {
  if (!name) return undefined;

  let exerciseInfo = exerciseDatabase.find((ex) => ex.name === name);
  if (!exerciseInfo && educationalId) {
    exerciseInfo = exerciseDatabase.find((ex) => ex.id === educationalId);
  }

  return exerciseInfo as ExerciseInfo | undefined;
}

export async function createExerciseAlternatives(
  workoutExerciseId: string,
  exerciseName: string,
  profile: any
) {
  if (!exerciseName || !profile) return;

  const exerciseInfo = getExerciseInfo(exerciseName);
  if (!exerciseInfo) return;

  const physicalLimitations = profile.physicalLimitations
    ? JSON.parse(profile.physicalLimitations)
    : [];
  const motorLimitations = profile.motorLimitations
    ? JSON.parse(profile.motorLimitations)
    : [];
  const medicalConditions = profile.medicalConditions
    ? JSON.parse(profile.medicalConditions)
    : [];
  const limitations = [
    ...physicalLimitations,
    ...motorLimitations,
    ...medicalConditions,
  ];

  const alternatives = generateAlternatives(
    exerciseInfo,
    profile.gymType,
    limitations
  );

  if (alternatives.length === 0) return;

  await db.alternativeExercise.createMany({
    data: alternatives.map((alt, index) => ({
      workoutExerciseId,
      name: alt.name,
      reason: alt.reason,
      educationalId: alt.educationalId || null,
      order: index,
    })),
  });
}

export function inferExerciseFromProfile(
  exerciseName: string,
  profile: any,
  defaultDifficulty: string
) {
  const exerciseInfo = exerciseDatabase.find((ex) => ex.name === exerciseName);

  const calculatedSets = calculateSets(
    profile.preferredSets,
    profile.activityLevel,
    profile.fitnessLevel
  );
  const calculatedReps = calculateReps(
    profile.preferredRepRange,
    profile.goals ? JSON.parse(profile.goals) : []
  );
  const calculatedRest = calculateRest(
    profile.restTime,
    profile.preferredRepRange
  );

  return {
    exerciseInfo,
    calculatedSets,
    calculatedReps,
    calculatedRest,
    difficulty: exerciseInfo?.difficulty || defaultDifficulty,
  };
}
