/**
 * API Route para Processar Comandos de Treinos no Servidor
 *
 * Processa comandos estruturados da IA e cria/edita/deleta workouts e exercícios
 * TODO: Implementar WebSockets para notificar progresso em tempo real
 */

import type { NextRequest } from "next/server";

// Configurar timeout aumentado para operações de processamento em batch
export const maxDuration = 60; // 60 segundos (máximo para Vercel Pro)
export const runtime = "nodejs"; // Garantir runtime Node.js para operações assíncronas

import { requireStudent } from "@/lib/api/middleware/auth.middleware";
import {
  badRequestResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { exerciseDatabase } from "@/lib/educational-data/exercises";
import {
  calculateReps,
  calculateRest,
  calculateSets,
  generateAlternatives,
} from "@/lib/services/personalized-workout-generator";
import type { ExerciseInfo, MuscleGroup } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student?.id;
    if (!studentId) {
      return badRequestResponse("Student ID não encontrado");
    }

    // 2. Processar request
    const body = await request.json();
    const { parsedPlan, unitId, planSlotId } = body;

    if (!parsedPlan) {
      return badRequestResponse("Comando inválido");
    }

    if (!unitId && !planSlotId) {
      return badRequestResponse("unitId ou planSlotId é obrigatório");
    }

    // 3. Resolver contexto: unit ou planSlot (weeklyPlan)
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
        return badRequestResponse("Você não tem permissão para editar esta unit");
      }
    }

    // 4. Buscar perfil do aluno
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { profile: true },
    });

    if (!student?.profile) {
      return badRequestResponse("Perfil do aluno não encontrado");
    }

    // 5. Processar comando (TUDO NO SERVIDOR)
    const results = {
      created: [] as string[],
      updated: [] as string[],
      deleted: [] as string[],
      errors: [] as string[],
    };

    switch (parsedPlan.action) {
      case "create_workouts": {
        // Criar workouts e exercícios em batch
        const workoutsToCreate = parsedPlan.workouts || [];

        // Plano semanal com múltiplos workouts: buscar todos os slots para distribuir
        let weeklyPlanSlots: { id: string; dayOfWeek: number; workoutId: string | null }[] = [];
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
              // Plano semanal: distribuir workouts nos slots (1 por dia)
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
                // Apenas 1 workout: usar o slot referenciado
                planSlotIdForCreate = planSlotId;
                order = planSlot.dayOfWeek;
              }
            } else if (unit) {
              // Contexto: unit legado
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
                description: workoutPlan.description || "",
                type: workoutPlan.type,
                muscleGroup: workoutPlan.muscleGroup,
                difficulty: workoutPlan.difficulty,
                estimatedTime: 0,
                order,
              },
            });

            if (planSlotIdForCreate) {
              const oldWorkoutId =
                weeklyPlanSlots[i]?.workoutId ?? planSlot?.workoutId ?? null;
              if (oldWorkoutId) {
                await db.workout.delete({ where: { id: oldWorkoutId } });
              }
              await db.planSlot.update({
                where: { id: planSlotIdForCreate },
                data: { type: "workout", workoutId: workout.id },
              });
            }

            results.created.push(`Workout: ${workoutPlan.title}`);

            const exercises = await createExercisesInBatch(
              workout.id,
              workoutPlan.exercises || [],
              student.profile,
              workoutPlan.difficulty,
            );

            results.created.push(
              `${exercises.length} exercícios em ${workoutPlan.title}`,
            );
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error));
            results.errors.push(
              `Erro ao criar workout ${workoutPlan.title}: ${err.message}`,
            );
          }
        }
        break;
      }

      case "delete_workout": {
        if (parsedPlan.targetWorkoutId) {
          const workouts = planSlot?.workout
            ? [planSlot.workout]
            : unit?.workouts ?? [];
          const workout = workouts.find(
            (w) => w.id === parsedPlan.targetWorkoutId,
          );
          if (workout) {
            await db.workout.delete({
              where: { id: parsedPlan.targetWorkoutId },
            });
            if (planSlot) {
              await db.planSlot.update({
                where: { id: planSlotId },
                data: { type: "rest", workoutId: null },
              });
            }
            results.deleted.push(`Workout: ${workout.title}`);
          }
        }
        break;
      }

      case "add_exercise": {
        if (parsedPlan.targetWorkoutId && parsedPlan.workouts.length > 0) {
          const workoutPlan = parsedPlan.workouts[0];
          const exercisesToAdd = workoutPlan.exercises || [];
          const workouts = planSlot?.workout
            ? [planSlot.workout]
            : unit?.workouts ?? [];
          const targetWorkout = workouts.find(
            (w) => w.id === parsedPlan.targetWorkoutId,
          );

          if (targetWorkout && exercisesToAdd.length > 0) {
            const currentExerciseCount = targetWorkout.exercises.length;

            const exercises = await createExercisesInBatch(
              parsedPlan.targetWorkoutId,
              exercisesToAdd,
              student.profile,
              workoutPlan.difficulty,
              currentExerciseCount,
            );

            results.created.push(`${exercises.length} exercícios adicionados`);
          }
        }
        break;
      }

      case "remove_exercise": {
        if (parsedPlan.targetWorkoutId && parsedPlan.exerciseToRemove) {
          const workouts = planSlot?.workout
            ? [planSlot.workout]
            : unit?.workouts ?? [];
          const workout = workouts.find(
            (w) => w.id === parsedPlan.targetWorkoutId,
          );
          if (workout) {
            const exercise = workout.exercises.find(
              (e) =>
                e.name
                  .toLowerCase()
                  .includes(parsedPlan.exerciseToRemove?.toLowerCase()) ||
                parsedPlan.exerciseToRemove
                  ?.toLowerCase()
                  .includes(e.name.toLowerCase()),
            );

            if (exercise) {
              await db.workoutExercise.delete({
                where: { id: exercise.id },
              });
              results.deleted.push(`Exercício: ${exercise.name}`);
            }
          }
        }
        break;
      }

      case "replace_exercise": {
        // Se veio a lista completa de workouts, refaça toda a grade (apenas para unit)
        if (parsedPlan.workouts.length > 1 && unit) {
          await db.workoutExercise.deleteMany({
            where: { workout: { unitId: unit.id } },
          });
          await db.workout.deleteMany({ where: { unitId: unit.id } });

          for (let i = 0; i < parsedPlan.workouts.length; i++) {
            const workoutPlan = parsedPlan.workouts[i];
            const newWorkout = await db.workout.create({
              data: {
                unitId: unit.id,
                title: workoutPlan.title,
                description: workoutPlan.description || "",
                type: workoutPlan.type,
                muscleGroup: workoutPlan.muscleGroup,
                difficulty: workoutPlan.difficulty,
                estimatedTime: 0,
                order: i,
              },
            });

            const exercises = await createExercisesInBatch(
              newWorkout.id,
              workoutPlan.exercises,
              student.profile,
              workoutPlan.difficulty,
              0,
              db,
            );

            results.created.push(`Workout: ${workoutPlan.title}`);
            results.created.push(
              `${exercises.length} exercícios em ${workoutPlan.title}`,
            );
          }
        } else if (
          parsedPlan.targetWorkoutId &&
          parsedPlan.exerciseToReplace &&
          parsedPlan.workouts.length > 0
        ) {
          const workouts = planSlot?.workout
            ? [planSlot.workout]
            : unit?.workouts ?? [];
          let workout = workouts.find(
            (w) => w.id === parsedPlan.targetWorkoutId,
          );
          if (!workout) {
            workout = workouts.find(
              (w) =>
                w.title.toLowerCase() ===
                String(parsedPlan.targetWorkoutId).toLowerCase(),
            );
          }
          if (workout) {
            const oldExercise = workout.exercises.find(
              (e) =>
                e.name
                  .toLowerCase()
                  .includes(parsedPlan.exerciseToReplace?.old.toLowerCase()) ||
                parsedPlan.exerciseToReplace?.old
                  .toLowerCase()
                  .includes(e.name.toLowerCase()),
            );

            if (oldExercise && parsedPlan.workouts[0].exercises.length > 0) {
              const newExercisePlan = parsedPlan.workouts[0].exercises[0];
              const order = oldExercise.order || 0;

              // Deletar exercício antigo
              await db.workoutExercise.delete({
                where: { id: oldExercise.id },
              });

              // Criar novo exercício (usar workout.id - workout pode ter sido encontrado por título)
              const _exercises = await createExercisesInBatch(
                workout.id,
                [newExercisePlan],
                student.profile,
                "intermediario",
                order,
                db,
              );

              results.deleted.push(`Exercício: ${oldExercise.name}`);
              results.created.push(`Exercício: ${newExercisePlan.name}`);
            }
          }
        }
        break;
      }

      case "update_workout": {
        if (parsedPlan.workouts.length > 1 && unit) {
          // Novo comportamento: JSON completo (apenas para unit).
          await db.workoutExercise.deleteMany({
            where: { workout: { unitId: unit.id } },
          });
          await db.workout.deleteMany({
            where: { unitId: unit.id },
          });

          for (let i = 0; i < parsedPlan.workouts.length; i++) {
            const workoutPlan = parsedPlan.workouts[i];
            const newWorkout = await db.workout.create({
              data: {
                unitId: unit.id,
                title: workoutPlan.title,
                description: workoutPlan.description || "",
                type: workoutPlan.type,
                muscleGroup: workoutPlan.muscleGroup,
                difficulty: workoutPlan.difficulty,
                estimatedTime: 0,
                order: i,
              },
            });

            const exercises = await createExercisesInBatch(
              newWorkout.id,
              workoutPlan.exercises,
              student.profile,
              workoutPlan.difficulty,
              0,
              db, // usar o client padrão
            );

            results.created.push(`Workout: ${workoutPlan.title}`);
            results.created.push(
              `${exercises.length} exercícios em ${workoutPlan.title}`,
            );
          }
        } else if (
          parsedPlan.targetWorkoutId &&
          parsedPlan.workouts.length > 0
        ) {
          // Atualizar apenas o workout referenciado
          const workoutPlan = parsedPlan.workouts[0];
          const workouts = planSlot?.workout
            ? [planSlot.workout]
            : unit?.workouts ?? [];

          let targetWorkout = workouts.find(
            (w) => w.id === parsedPlan.targetWorkoutId,
          );

          if (!targetWorkout) {
            targetWorkout = workouts.find((w) => {
              const targetTitle = parsedPlan.targetWorkoutId
                .toLowerCase()
                .trim();
              const workoutTitle = w.title.toLowerCase().trim();
              return (
                workoutTitle === targetTitle ||
                workoutTitle.includes(targetTitle) ||
                targetTitle.includes(workoutTitle)
              );
            });
          }

          if (targetWorkout) {
            // Atualizar dados do workout
            await db.workout.update({
              where: { id: targetWorkout.id },
              data: {
                title: workoutPlan.title,
                description: workoutPlan.description || "",
                type: workoutPlan.type,
                muscleGroup: workoutPlan.muscleGroup,
                difficulty: workoutPlan.difficulty,
              },
            });

            // Deletar todos os exercícios antigos
            await db.workoutExercise.deleteMany({
              where: { workoutId: targetWorkout.id },
            });

            // Criar novos exercícios
            const exercises = await createExercisesInBatch(
              targetWorkout.id,
              workoutPlan.exercises,
              student.profile,
              workoutPlan.difficulty,
            );

            results.updated.push(`Workout: ${workoutPlan.title}`);
            results.created.push(
              `${exercises.length} exercícios em ${workoutPlan.title}`,
            );
          } else if (unit || planSlot) {
            // Se não encontrou, pode ser um workout novo nos previews - criar novo
            console.log(
              `[update_workout] Workout não encontrado pelo ID/título "${parsedPlan.targetWorkoutId}", criando novo...`,
            );

            let order = 0;
            let unitIdForCreate: string | null = null;
            let planSlotIdForCreate: string | null = null;

            if (planSlot) {
              planSlotIdForCreate = planSlotId!;
              order = planSlot.dayOfWeek;
            } else if (unit) {
              unitIdForCreate = unit.id;
              order =
                unit.workouts.length > 0
                  ? Math.max(...unit.workouts.map((w) => w.order ?? 0)) + 1
                  : 0;
            }

            const newWorkout = await db.workout.create({
              data: {
                unitId: unitIdForCreate,
                title: workoutPlan.title,
                description: workoutPlan.description || "",
                type: workoutPlan.type,
                muscleGroup: workoutPlan.muscleGroup,
                difficulty: workoutPlan.difficulty,
                estimatedTime: 0,
                order,
              },
            });

            if (planSlotIdForCreate) {
              await db.planSlot.update({
                where: { id: planSlotIdForCreate },
                data: { type: "workout", workoutId: newWorkout.id },
              });
            }

            const exercises = await createExercisesInBatch(
              newWorkout.id,
              workoutPlan.exercises,
              student.profile,
              workoutPlan.difficulty,
            );

            results.created.push(`Workout: ${workoutPlan.title}`);
            results.created.push(
              `${exercises.length} exercícios em ${workoutPlan.title}`,
            );
          }
        }
        break;
      }

      default:
        return badRequestResponse(`Ação não suportada: ${parsedPlan.action}`);
    }

    return successResponse({
      message: "Comando processado com sucesso",
      results,
    });
  } catch (error) {
    console.error("[workouts/process] Erro:", error);
    return internalErrorResponse("Erro ao processar comando", error);
  }
}

/** Perfil do aluno compatível com Prisma (aceita null) */
type ProfileForExercises = {
  preferredSets?: number | null;
  activityLevel?: number | null;
  fitnessLevel?: string | null;
  preferredRepRange?: string | null;
  restTime?: string | null;
  goals?: string | null;
  physicalLimitations?: string | null;
  motorLimitations?: string | null;
  medicalConditions?: string | null;
  gymType?: string | null;
};

/**
 * Cria exercícios em batch no servidor
 */
async function createExercisesInBatch(
  workoutId: string,
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    rest: number;
    notes?: string;
    alternatives?: string[]; // Alternativas fornecidas pela IA
  }>,
  profile: ProfileForExercises,
  defaultDifficulty: string,
  startOrder: number = 0,
  prismaClient: typeof db = db,
): Promise<Awaited<ReturnType<typeof prismaClient.workoutExercise.create>>[]> {
  const createdExercises = [];

  console.log(
    `[createExercisesInBatch] Criando ${exercises.length} exercícios para workout ${workoutId}`,
  );

  for (let i = 0; i < exercises.length; i++) {
    const exercisePlan = exercises[i];

    try {
      console.log(
        `[createExercisesInBatch] Processando exercício ${i + 1}/${exercises.length}: ${exercisePlan.name}`,
      );

      // Buscar ou criar exercício no database educacional
      const exerciseInfo = findOrCreateExercise(exercisePlan.name);

      console.log(
        `[createExercisesInBatch] Exercício encontrado/criado: ${exerciseInfo.id} - ${exerciseInfo.name}`,
      );

      // Calcular sets, reps e rest baseado nas preferências do aluno
      const calculatedSets =
        exercisePlan.sets ||
        calculateSets(
          profile.preferredSets,
          profile.activityLevel,
          profile.fitnessLevel,
        );
      const calculatedReps =
        exercisePlan.reps ||
        calculateReps(
          profile.preferredRepRange,
          profile.goals ? JSON.parse(profile.goals) : [],
        );
      const calculatedRest =
        exercisePlan.rest !== undefined
          ? exercisePlan.rest
          : calculateRest(profile.restTime, profile.preferredRepRange);

      // Criar exercício
      const exercise = await prismaClient.workoutExercise.create({
        data: {
          workoutId,
          name: exerciseInfo.name,
          sets: calculatedSets,
          reps: calculatedReps,
          rest: calculatedRest,
          notes: exercisePlan.notes || null,
          educationalId: exerciseInfo.id,
          order: startOrder + i,
          primaryMuscles:
            exerciseInfo.primaryMuscles &&
            exerciseInfo.primaryMuscles.length > 0
              ? JSON.stringify(exerciseInfo.primaryMuscles)
              : null,
          secondaryMuscles:
            exerciseInfo.secondaryMuscles &&
            exerciseInfo.secondaryMuscles.length > 0
              ? JSON.stringify(exerciseInfo.secondaryMuscles)
              : null,
          difficulty: exerciseInfo.difficulty || defaultDifficulty,
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
            exerciseInfo.commonMistakes &&
            exerciseInfo.commonMistakes.length > 0
              ? JSON.stringify(exerciseInfo.commonMistakes)
              : null,
          benefits:
            exerciseInfo.benefits && exerciseInfo.benefits.length > 0
              ? JSON.stringify(exerciseInfo.benefits)
              : null,
          scientificEvidence: exerciseInfo.scientificEvidence || null,
        },
      });

      // Processar alternativas: usar as da IA se disponíveis, senão gerar automaticamente
      try {
        let alternativesToCreate: Array<{
          name: string;
          reason: string;
          educationalId: string | null;
        }> = [];

        // Se a IA forneceu alternativas, usar elas (prioridade)
        if (
          exercisePlan.alternatives &&
          Array.isArray(exercisePlan.alternatives) &&
          exercisePlan.alternatives.length > 0
        ) {
          console.log(
            `[createExercisesInBatch] Usando ${exercisePlan.alternatives.length} alternativas fornecidas pela IA`,
          );
          alternativesToCreate = exercisePlan.alternatives
            .slice(0, 3)
            .map((altName: string) => ({
              name: altName.trim(),
              reason: "Alternativa sugerida pela IA",
              educationalId: null,
            }));
        } else if (profile && exerciseInfo) {
          // Fallback: gerar alternativas automaticamente se IA não forneceu
          console.log(
            `[createExercisesInBatch] Gerando alternativas automaticamente para ${exercisePlan.name}`,
          );
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

          const generatedAlternatives = generateAlternatives(
            exerciseInfo,
            profile.gymType,
            limitations,
          );

          alternativesToCreate = generatedAlternatives.map((alt) => ({
            name: alt.name,
            reason: alt.reason,
            educationalId: alt.educationalId || null,
          }));
        }

        // Criar alternativas no banco
        if (alternativesToCreate.length > 0) {
          await prismaClient.alternativeExercise.createMany({
            data: alternativesToCreate.map((alt, index) => ({
              workoutExerciseId: exercise.id,
              name: alt.name,
              reason: alt.reason,
              educationalId: alt.educationalId,
              order: index,
            })),
          });
          console.log(
            `[createExercisesInBatch] ✅ ${alternativesToCreate.length} alternativas criadas para ${exercisePlan.name}`,
          );
        } else {
          console.warn(
            `[createExercisesInBatch] ⚠️ Nenhuma alternativa criada para ${exercisePlan.name} - IA deveria fornecer 2-3 alternativas`,
          );
        }
      } catch (altError) {
        console.error(
          "[createExercisesInBatch] Erro ao adicionar alternativas:",
          altError,
        );
        // Não falhar a criação do exercício se houver erro nas alternativas
      }

      createdExercises.push(exercise);
      console.log(
        `[createExercisesInBatch] ✅ Exercício criado com sucesso: ${exercise.name} (ID: ${exercise.id})`,
      );
    } catch (exerciseError) {
      // Log do erro mas continue criando os outros exercícios
      console.error(
        `[createExercisesInBatch] ❌ Erro ao criar exercício ${exercisePlan.name}:`,
        exerciseError,
      );
      // Não adicionar ao array de criados, mas continuar o loop
    }
  }

  console.log(
    `[createExercisesInBatch] ✅ Total de ${createdExercises.length}/${exercises.length} exercícios criados com sucesso`,
  );
  return createdExercises;
}

/**
 * Busca exercício no database educacional ou cria virtualmente
 */
function findOrCreateExercise(exerciseName: string): ExerciseInfo {
  // Normalizar nome para busca
  const normalizedName = exerciseName
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Buscar por nome (case-insensitive e removendo acentos)
  let exerciseInfo = exerciseDatabase.find((ex) => {
    const exName = ex.name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return (
      exName === normalizedName ||
      exName.includes(normalizedName) ||
      normalizedName.includes(exName)
    );
  });

  // Se não encontrou, criar exercício virtual
  if (!exerciseInfo) {
    const generatedId = exerciseName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Helper para inferir grupo muscular
    const inferMuscleGroup = (name: string): string[] => {
      const normalized = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const rules: Array<{ muscles: string[]; keywords: string[] }> = [
        { muscles: ["peito"], keywords: ["peito", "supino", "crucifixo"] },
        {
          muscles: ["costas"],
          keywords: ["costas", "remada", "puxada", "barra fixa"],
        },
        {
          muscles: ["pernas"],
          keywords: [
            "pernas",
            "perna",
            "agachamento",
            "leg press",
            "extensora",
            "flexora",
            "afundo",
            "quadriceps",
            "quadríceps",
          ],
        },
        {
          muscles: ["pernas", "gluteos"],
          keywords: ["posterior", "stiff", "gluteo", "glúteo"],
        },
        {
          muscles: ["ombros"],
          keywords: [
            "ombros",
            "desenvolvimento",
            "elevacao",
            "elevação",
            "lateral",
            "frontal",
          ],
        },
        {
          muscles: ["bracos"],
          keywords: [
            "triceps",
            "tríceps",
            "pulley",
            "testa",
            "frances",
            "francês",
            "biceps",
            "bíceps",
            "rosca",
          ],
        },
        {
          muscles: ["core"],
          keywords: ["abdominal", "abdomen", "core", "prancha"],
        },
        {
          muscles: ["antebraco"],
          keywords: [
            "antebraco",
            "antebraço",
            "punho",
            "pulso",
            "extensao de punho",
            "extensão de punho",
            "rosca de punho",
          ],
        },
        {
          muscles: ["panturrilha"],
          keywords: ["panturrilha", "gastrocnemio", "gemio"],
        },
        {
          muscles: ["trapezio"],
          keywords: ["trapezio", "trapézio", "encolhimento"],
        },
      ];

      for (const rule of rules) {
        if (rule.keywords.some((kw) => normalized.includes(kw))) {
          return rule.muscles;
        }
      }
      return ["full-body"];
    };

    // Helper para inferir equipamento
    const inferEquipment = (name: string): string[] => {
      const normalized = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const rules: Array<{ equipment: string[]; keywords: string[] }> = [
        {
          equipment: ["Máquina"],
          keywords: [
            "maquina",
            "máquina",
            "cadeira",
            "extensora",
            "flexora",
            "leg press",
          ],
        },
        {
          equipment: ["Barra", "Anilhas"],
          keywords: ["barra", "supino", "agachamento", "terra"],
        },
        {
          equipment: ["Halteres"],
          keywords: ["halter", "elevacao", "elevação", "rosca"],
        },
        {
          equipment: ["Cabo", "Polia"],
          keywords: ["cabo", "pulley", "polia"],
        },
        {
          equipment: ["Barras Paralelas"],
          keywords: ["paralelas", "barra fixa"],
        },
        {
          equipment: ["Barra", "Halteres"],
          keywords: ["punho", "pulso", "antebraco", "antebraço"],
        },
      ];

      for (const rule of rules) {
        if (rule.keywords.some((kw) => normalized.includes(kw))) {
          return rule.equipment;
        }
      }

      return [];
    };

    exerciseInfo = {
      id: generatedId,
      name: exerciseName,
      primaryMuscles: inferMuscleGroup(
        exerciseName,
      ) as MuscleGroup[],
      secondaryMuscles: [] as MuscleGroup[],
      difficulty: "intermediario",
      equipment: inferEquipment(exerciseName),
      instructions: [
        `Execute ${exerciseName} com forma correta`,
        "Mantenha o movimento controlado",
        "Use peso adequado",
      ],
      tips: [
        "Mantenha a forma correta",
        "Controle o movimento",
        "Use amplitude completa",
      ],
      commonMistakes: [
        "Não usar amplitude completa",
        "Peso excessivo",
        "Forma incorreta",
      ],
      benefits: [
        "Desenvolvimento muscular",
        "Aumento de força",
        "Melhora de condicionamento",
      ],
      scientificEvidence: undefined,
    };
  }

  return exerciseInfo as ExerciseInfo;
}
