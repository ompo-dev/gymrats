/**
 * API Route para Processar Comandos de Treinos no Servidor (Gym)
 */
import type { NextRequest } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";

import type { Prisma } from "@prisma/client";
import {
  AuthorizationError,
  requireAbility,
} from "@/lib/access-control/server";
import { Features } from "@/lib/access-control/features";
import {
  badRequestResponse,
  internalErrorResponse,
  successResponse,
  forbiddenResponse,
} from "@/lib/api/utils/response.utils";
import { db } from "@/lib/db";
import { exerciseDatabase } from "@/lib/educational-data/exercises";
import {
  calculateReps,
  calculateRest,
  calculateSets,
  generateAlternatives,
} from "@/lib/services/personalized-workout-generator";
import type { ExerciseInfo, MuscleGroup } from "@/lib/types";
import { getGymContext } from "@/lib/utils/gym/gym-context";

async function createExercisesInWorkout(
  workoutId: string,
  exercises: Array<{
    name: string;
    sets?: number;
    reps?: string;
    rest?: number;
    notes?: string;
  }>,
  studentProfile: {
    preferredSets?: number | null;
    preferredRepRange?: string | null;
    restTime?: string | null;
    activityLevel?: string | null;
    fitnessLevel?: string | null;
    goals?: string | null;
    gymType?: string | null;
    physicalLimitations?: string | null;
    motorLimitations?: string | null;
    medicalConditions?: string | null;
  },
  difficulty: string | undefined,
) {
  for (let j = 0; j < exercises.length; j++) {
    const exercise = exercises[j];
    if (!exercise.name) continue;

    let exerciseInfo: ExerciseInfo | null = null;
    const searchName = exercise.name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    exerciseInfo =
      exerciseDatabase.find((ex) => {
        const exName = ex.name
          .toLowerCase()
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        return (
          exName === searchName ||
          exName.includes(searchName) ||
          searchName.includes(exName)
        );
      }) ?? null;

    if (!exerciseInfo) {
      const generatedId = exercise.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      exerciseInfo = {
        id: generatedId,
        name: exercise.name,
        primaryMuscles: ["core" as MuscleGroup],
        secondaryMuscles: [],
        difficulty: "intermediario",
        equipment: [],
        instructions: [],
        tips: [],
        commonMistakes: [],
        benefits: [],
      };
    }

    const goals = studentProfile.goals
      ? (JSON.parse(studentProfile.goals) as string[])
      : undefined;

    const calculatedSets =
      exercise.sets ||
      calculateSets(
        studentProfile.preferredSets ?? undefined,
        studentProfile.activityLevel ?? undefined,
        (studentProfile.fitnessLevel as
          | "iniciante"
          | "intermediario"
          | "avancado"
          | undefined) ?? undefined,
      );
    const calculatedReps =
      exercise.reps ||
      calculateReps(
        (studentProfile.preferredRepRange as
          | "forca"
          | "hipertrofia"
          | "resistencia"
          | undefined) ?? undefined,
        goals,
      );
    const calculatedRest =
      exercise.rest !== undefined
        ? exercise.rest
        : calculateRest(
            (studentProfile.restTime as
              | "curto"
              | "medio"
              | "longo"
              | undefined) ?? undefined,
            (studentProfile.preferredRepRange as
              | "forca"
              | "hipertrofia"
              | "resistencia"
              | undefined) ?? undefined,
          );

    const createdExercise = await db.workoutExercise.create({
      data: {
        workoutId,
        name: exercise.name,
        sets: calculatedSets,
        reps: calculatedReps,
        rest: calculatedRest,
        notes: exercise.notes ?? null,
        order: j,
        primaryMuscles: exerciseInfo.primaryMuscles
          ? JSON.stringify(exerciseInfo.primaryMuscles)
          : null,
        secondaryMuscles: exerciseInfo.secondaryMuscles
          ? JSON.stringify(exerciseInfo.secondaryMuscles)
          : null,
        difficulty: exerciseInfo.difficulty || difficulty || null,
        equipment: exerciseInfo.equipment
          ? JSON.stringify(exerciseInfo.equipment)
          : null,
        instructions: exerciseInfo.instructions
          ? JSON.stringify(exerciseInfo.instructions)
          : null,
        tips: exerciseInfo.tips ? JSON.stringify(exerciseInfo.tips) : null,
        commonMistakes: exerciseInfo.commonMistakes
          ? JSON.stringify(exerciseInfo.commonMistakes)
          : null,
        benefits: exerciseInfo.benefits
          ? JSON.stringify(exerciseInfo.benefits)
          : null,
        educationalId: exerciseInfo.id || null,
      },
    });

    try {
      const physicalLimitations = studentProfile.physicalLimitations
        ? JSON.parse(studentProfile.physicalLimitations)
        : [];
      const motorLimitations = studentProfile.motorLimitations
        ? JSON.parse(studentProfile.motorLimitations)
        : [];
      const medicalConditions = studentProfile.medicalConditions
        ? JSON.parse(studentProfile.medicalConditions)
        : [];
      const limitations = [
        ...physicalLimitations,
        ...motorLimitations,
        ...medicalConditions,
      ];

      const alternatives = generateAlternatives(
        exerciseInfo,
        studentProfile.gymType as
          | "academia-completa"
          | "academia-basica"
          | "home-gym"
          | "peso-corporal"
          | null,
        limitations,
      );

      if (alternatives.length > 0) {
        await db.alternativeExercise.createMany({
          data: alternatives.map((alt, index) => ({
            workoutExerciseId: createdExercise.id,
            name: alt.name,
            reason: alt.reason,
            educationalId: alt.educationalId || null,
            order: index,
          })),
        });
      }
    } catch (altError) {
      console.error(
        "[gym/workouts/process] Erro ao adicionar alternativas:",
        altError,
      );
    }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { ctx, errorResponse } = await getGymContext();
    if (errorResponse || !ctx) {
      return errorResponse ?? internalErrorResponse("Não autenticado");
    }

    await requireAbility(Features.USE_AI_WORKOUT, request);

    const { id: studentId } = await params;
    const membership = await db.gymMembership.findFirst({
      where: { gymId: ctx.gymId, studentId },
    });
    if (!membership) {
      return forbiddenResponse(
        "Aluno não encontrado ou não pertence a esta academia",
      );
    }

    const body = await request.json();
    const { parsedPlan, unitId, planSlotId } = body;

    if (!parsedPlan) {
      return badRequestResponse("Comando inválido");
    }

    if (!unitId && !planSlotId) {
      return badRequestResponse("unitId ou planSlotId é obrigatório");
    }

    type UnitWithWorkouts = Prisma.UnitGetPayload<{
      include: { workouts: { include: { exercises: true } } };
    }>;
    type PlanSlotWithRelations = Prisma.PlanSlotGetPayload<{
      include: {
        weeklyPlan: true;
        workout: { include: { exercises: true } };
      };
    }>;
    let unit: UnitWithWorkouts | null = null;
    let planSlot: PlanSlotWithRelations | null = null;

    if (planSlotId) {
      planSlot = await db.planSlot.findUnique({
        where: { id: planSlotId },
        include: {
          weeklyPlan: true,
          workout: {
            include: {
              exercises: { orderBy: { order: "asc" } },
            },
          },
        },
      });

      if (!planSlot || planSlot.weeklyPlan.studentId !== studentId) {
        return badRequestResponse("Slot não encontrado ou sem permissão");
      }
    } else if (unitId) {
      unit = await db.unit.findUnique({
        where: { id: unitId },
        include: {
          workouts: {
            orderBy: { order: "asc" },
            include: {
              exercises: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      });

      if (!unit) {
        return badRequestResponse("Unit não encontrada");
      }

      if (unit.studentId !== studentId) {
        return badRequestResponse(
          "Você não tem permissão para editar esta unit",
        );
      }
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { profile: true },
    });

    if (!student?.profile) {
      return badRequestResponse("Perfil do aluno não encontrado");
    }

    const results = {
      created: [] as string[],
      updated: [] as string[],
      deleted: [] as string[],
      errors: [] as string[],
    };

    switch (parsedPlan.action) {
      case "create_workouts": {
        const workoutsToCreate = parsedPlan.workouts || [];

        let weeklyPlanSlots: {
          id: string;
          dayOfWeek: number;
          workoutId: string | null;
        }[] = [];
        if (planSlotId && planSlot && workoutsToCreate.length > 1) {
          weeklyPlanSlots = await db.planSlot.findMany({
            where: { weeklyPlanId: planSlot.weeklyPlanId },
            orderBy: { dayOfWeek: "asc" },
            select: { id: true, dayOfWeek: true, workoutId: true },
          });
        }

        for (let i = 0; i < workoutsToCreate.length; i++) {
          const workoutPlan = workoutsToCreate[i];
          try {
            let order = i;
            let unitIdForCreate: string | null = null;
            let planSlotIdForCreate: string | null = null;

            if (planSlotId && planSlot) {
              if (workoutsToCreate.length > 1 && weeklyPlanSlots.length > 0) {
                const targetSlot = weeklyPlanSlots[i];
                if (!targetSlot) {
                  results.errors.push(
                    `Slot para dia ${i} não encontrado. Ignorando ${workoutPlan.title}.`,
                  );
                  continue;
                }
                planSlotIdForCreate = targetSlot.id;
                order = targetSlot.dayOfWeek;
              } else {
                planSlotIdForCreate = planSlotId;
                order = planSlot.dayOfWeek;
              }
            } else if (unit) {
              unitIdForCreate = unit.id;
              order =
                unit.workouts.length > 0
                  ? Math.max(...unit.workouts.map((w) => w.order ?? 0)) + i + 1
                  : i;
            }

            const isRestDay =
              workoutPlan.title?.toLowerCase().includes("descanso") ||
              !workoutPlan.exercises?.length;

            if (isRestDay && planSlotIdForCreate) {
              const oldWorkoutId =
                weeklyPlanSlots[i]?.workoutId ?? planSlot?.workoutId ?? null;
              if (oldWorkoutId) {
                await db.workout.delete({ where: { id: oldWorkoutId } });
              }
              await db.planSlot.update({
                where: { id: planSlotIdForCreate },
                data: { type: "rest", workoutId: null },
              });
              results.created.push(`Workout: ${workoutPlan.title} (descanso)`);
              continue;
            }

            const workout = await db.workout.create({
              data: {
                unitId: unitIdForCreate,
                title: workoutPlan.title,
                description: workoutPlan.description,
                type: workoutPlan.type || "strength",
                muscleGroup: workoutPlan.muscleGroup || "full-body",
                difficulty: workoutPlan.difficulty || "intermediario",
                xpReward: 10,
                estimatedTime: 30,
                order,
              },
            });

            if (planSlotIdForCreate) {
              await db.planSlot.update({
                where: { id: planSlotIdForCreate },
                data: { type: "workout", workoutId: workout.id },
              });
            }

            if (workoutPlan.exercises && workoutPlan.exercises.length > 0) {
              for (let j = 0; j < workoutPlan.exercises.length; j++) {
                const exercise = workoutPlan.exercises[j];
                if (!exercise.name) continue;

                let exerciseInfo: ExerciseInfo | null = null;
                if (exercise.name) {
                  const searchName = exercise.name
                    .toLowerCase()
                    .trim()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");
                  exerciseInfo =
                    exerciseDatabase.find((ex) => {
                      const exName = ex.name
                        .toLowerCase()
                        .trim()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "");
                      return (
                        exName === searchName ||
                        exName.includes(searchName) ||
                        searchName.includes(exName)
                      );
                    }) ?? null;
                }

                if (!exerciseInfo && exercise.name) {
                  const generatedId = exercise.name
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "");

                  exerciseInfo = {
                    id: generatedId,
                    name: exercise.name,
                    primaryMuscles: ["core" as MuscleGroup],
                    secondaryMuscles: [],
                    difficulty: "intermediario",
                    equipment: [],
                    instructions: [],
                    tips: [],
                    commonMistakes: [],
                    benefits: [],
                  };
                }

                const profile = {
                  preferredSets: student.profile.preferredSets ?? undefined,
                  preferredRepRange: student.profile.preferredRepRange as
                    | "forca"
                    | "hipertrofia"
                    | "resistencia"
                    | undefined,
                  restTime: student.profile.restTime as
                    | "curto"
                    | "medio"
                    | "longo"
                    | undefined,
                  activityLevel: student.profile.activityLevel ?? undefined,
                  fitnessLevel: student.profile.fitnessLevel as
                    | "iniciante"
                    | "intermediario"
                    | "avancado"
                    | undefined,
                  goals: student.profile.goals
                    ? (JSON.parse(student.profile.goals) as string[])
                    : undefined,
                };

                const calculatedSets =
                  exercise.sets ||
                  calculateSets(
                    profile.preferredSets,
                    profile.activityLevel,
                    profile.fitnessLevel,
                  );
                const calculatedReps =
                  exercise.reps ||
                  calculateReps(profile.preferredRepRange, profile.goals);
                const calculatedRest =
                  exercise.rest !== undefined
                    ? exercise.rest
                    : calculateRest(profile.restTime, profile.preferredRepRange);

                const createdExercise = await db.workoutExercise.create({
                  data: {
                    workoutId: workout.id,
                    name: exercise.name,
                    sets: calculatedSets,
                    reps: calculatedReps,
                    rest: calculatedRest,
                    notes: exercise.notes ?? null,
                    order: j,
                    primaryMuscles: exerciseInfo?.primaryMuscles
                      ? JSON.stringify(exerciseInfo.primaryMuscles)
                      : null,
                    secondaryMuscles: exerciseInfo?.secondaryMuscles
                      ? JSON.stringify(exerciseInfo.secondaryMuscles)
                      : null,
                    difficulty: exerciseInfo?.difficulty || null,
                    equipment: exerciseInfo?.equipment
                      ? JSON.stringify(exerciseInfo.equipment)
                      : null,
                    instructions: exerciseInfo?.instructions
                      ? JSON.stringify(exerciseInfo.instructions)
                      : null,
                    tips: exerciseInfo?.tips
                      ? JSON.stringify(exerciseInfo.tips)
                      : null,
                    commonMistakes: exerciseInfo?.commonMistakes
                      ? JSON.stringify(exerciseInfo.commonMistakes)
                      : null,
                    benefits: exerciseInfo?.benefits
                      ? JSON.stringify(exerciseInfo.benefits)
                      : null,
                    educationalId: exerciseInfo?.id || null,
                  },
                });

                if (exerciseInfo && student?.profile) {
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

                  const alternatives = generateAlternatives(
                    exerciseInfo,
                    student.profile.gymType as
                      | "academia-completa"
                      | "academia-basica"
                      | "home-gym"
                      | "peso-corporal"
                      | null,
                    limitations,
                  );

                  if (alternatives.length > 0) {
                    await db.alternativeExercise.createMany({
                      data: alternatives.map((alt, index) => ({
                        workoutExerciseId: createdExercise.id,
                        name: alt.name,
                        reason: alt.reason,
                        educationalId: alt.educationalId || null,
                        order: index,
                      })),
                    });
                  }
                }
              }
            }

            results.created.push(
              `Workout: ${workoutPlan.title ?? "Treino"}`,
            );
          } catch (error) {
            console.error("[gym/workouts/process] Erro ao criar workout:", error);
            results.errors.push(
              `Erro ao criar workout ${workoutPlan.title ?? "Treino"}`,
            );
          }
        }
        break;
      }
      case "update_workout": {
        const targetId =
          parsedPlan.targetWorkoutId ||
          (planSlot?.workoutId ?? undefined) ||
          (unit?.workouts?.[0]?.id ?? undefined);
        if (!targetId) {
          results.errors.push("Workout alvo não encontrado para atualização");
          break;
        }

        const workout = await db.workout.findUnique({
          where: { id: targetId },
          include: { planSlot: { include: { weeklyPlan: true } }, unit: true },
        });

        if (
          !workout ||
          (workout.unit && workout.unit.studentId !== studentId) ||
          (workout.planSlot &&
            workout.planSlot.weeklyPlan.studentId !== studentId)
        ) {
          results.errors.push("Workout não encontrado ou sem permissão");
          break;
        }

        const updateData = parsedPlan.workouts?.[0] ?? {};
        await db.workout.update({
          where: { id: targetId },
          data: {
            ...(updateData.title && { title: updateData.title }),
            ...(updateData.description && { description: updateData.description }),
            ...(updateData.type && { type: updateData.type }),
            ...(updateData.muscleGroup && { muscleGroup: updateData.muscleGroup }),
            ...(updateData.difficulty && { difficulty: updateData.difficulty }),
          },
        });

        if (Array.isArray(updateData.exercises)) {
          await db.workoutExercise.deleteMany({ where: { workoutId: targetId } });
          await createExercisesInWorkout(
            targetId,
            updateData.exercises
              .filter((e) => !!e?.name)
              .map((e) => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                rest: e.rest,
                notes: e.notes,
              })),
            student.profile,
            updateData.difficulty,
          );
        }

        results.updated.push(`Workout atualizado: ${workout.title}`);
        break;
      }
      case "delete_workout": {
        const targetId =
          parsedPlan.targetWorkoutId ||
          (planSlot?.workoutId ?? undefined) ||
          (unit?.workouts?.[0]?.id ?? undefined);
        if (!targetId) {
          results.errors.push("Workout alvo não encontrado para exclusão");
          break;
        }

        const workout = await db.workout.findUnique({
          where: { id: targetId },
          include: { planSlot: true, unit: true },
        });

        if (!workout) {
          results.errors.push("Workout não encontrado para exclusão");
          break;
        }

        if (workout.planSlot) {
          await db.planSlot.update({
            where: { id: workout.planSlot.id },
            data: { type: "rest", workoutId: null },
          });
        }

        await db.workout.delete({ where: { id: targetId } });
        results.deleted.push(`Workout removido: ${workout.title}`);
        break;
      }
      case "add_exercise": {
        const targetId =
          parsedPlan.targetWorkoutId ||
          (planSlot?.workoutId ?? undefined) ||
          (unit?.workouts?.[0]?.id ?? undefined);
        const firstWorkout = parsedPlan.workouts?.[0];
        if (!targetId || !firstWorkout?.exercises?.length) {
          results.errors.push("Exercícios não encontrados para adicionar");
          break;
        }
        await createExercisesInWorkout(
          targetId,
          firstWorkout.exercises
            .filter((e) => !!e?.name)
            .map((e) => ({
              name: e.name,
              sets: e.sets,
              reps: e.reps,
              rest: e.rest,
              notes: e.notes,
            })),
          student.profile,
          firstWorkout.difficulty,
        );
        results.created.push(
          `Exercícios adicionados em ${firstWorkout.title ?? "workout"}`,
        );
        break;
      }
      case "remove_exercise": {
        const targetId =
          parsedPlan.targetWorkoutId ||
          (planSlot?.workoutId ?? undefined) ||
          (unit?.workouts?.[0]?.id ?? undefined);
        const targetExerciseName = parsedPlan.exerciseToRemove;
        if (!targetId || !targetExerciseName) {
          results.errors.push("Exercício alvo não encontrado para remover");
          break;
        }
        await db.workoutExercise.deleteMany({
          where: {
            workoutId: targetId,
            name: { contains: targetExerciseName, mode: "insensitive" },
          },
        });
        results.deleted.push(`Exercício removido: ${targetExerciseName}`);
        break;
      }
      case "replace_exercise": {
        const targetId =
          parsedPlan.targetWorkoutId ||
          (planSlot?.workoutId ?? undefined) ||
          (unit?.workouts?.[0]?.id ?? undefined);
        const replace = parsedPlan.exerciseToReplace;
        if (!targetId || !replace?.old || !replace?.new) {
          results.errors.push("Exercício alvo não encontrado para troca");
          break;
        }
        await db.workoutExercise.deleteMany({
          where: {
            workoutId: targetId,
            name: { contains: replace.old, mode: "insensitive" },
          },
        });
        await createExercisesInWorkout(
          targetId,
          [{ name: replace.new }],
          student.profile,
          parsedPlan.workouts?.[0]?.difficulty,
        );
        results.updated.push(
          `Exercício trocado: ${replace.old} → ${replace.new}`,
        );
        break;
      }
      default:
        return badRequestResponse(
          `Ação não suportada: ${parsedPlan.action}`,
        );
    }

    return successResponse({
      message: "Comando processado com sucesso",
      results,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return forbiddenResponse(error.message);
    }
    console.error("[gym/workouts/process] Erro:", error);
    return internalErrorResponse("Erro ao processar comando", error);
  }
}
