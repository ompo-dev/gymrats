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
import { db } from "@/lib/db";
import { exerciseDatabase } from "@/lib/educational-data";
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
    const { parsedPlan, unitId } = body;

    if (!parsedPlan) {
      return badRequestResponse("Comando inválido");
    }

    if (!unitId || typeof unitId !== "string") {
      return badRequestResponse("Unit ID é obrigatório");
    }

    // 3. Verificar se unit existe e pertence ao student
    const unit = await db.unit.findUnique({
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
        for (let i = 0; i < parsedPlan.workouts.length; i++) {
          const workoutPlan = parsedPlan.workouts[i];
          try {
            // Buscar último order
            const lastOrder =
              unit.workouts.length > 0
                ? Math.max(...unit.workouts.map((w) => w.order ?? 0)) + i + 1
                : i; // manter exatamente a ordem recebida

            // Criar workout
            const workout = await db.workout.create({
              data: {
                unitId,
                title: workoutPlan.title,
                description: workoutPlan.description || "",
                type: workoutPlan.type,
                muscleGroup: workoutPlan.muscleGroup,
                difficulty: workoutPlan.difficulty,
                estimatedTime: 0,
                order: lastOrder,
              },
            });

            results.created.push(`Workout: ${workoutPlan.title}`);

            // Criar exercícios em batch para este workout
            const exercises = await createExercisesInBatch(
              workout.id,
              workoutPlan.exercises,
              student.profile,
              workoutPlan.difficulty,
            );

            results.created.push(
              `${exercises.length} exercícios em ${workoutPlan.title}`,
            );
          } catch (error: unknown) {
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
          const workout = unit.workouts.find(
            (w) => w.id === parsedPlan.targetWorkoutId,
          );
          if (workout) {
            await db.workout.delete({
              where: { id: parsedPlan.targetWorkoutId },
            });
            results.deleted.push(`Workout: ${workout.title}`);
          }
        }
        break;
      }

      case "add_exercise": {
        if (parsedPlan.targetWorkoutId && parsedPlan.workouts.length > 0) {
          const workoutPlan = parsedPlan.workouts[0];
          const targetWorkout = unit.workouts.find(
            (w) => w.id === parsedPlan.targetWorkoutId,
          );

          if (targetWorkout) {
            const currentExerciseCount = targetWorkout.exercises.length;

            const exercises = await createExercisesInBatch(
              parsedPlan.targetWorkoutId,
              workoutPlan.exercises,
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
          const workout = unit.workouts.find(
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
        // Se veio a lista completa de workouts, refaça toda a grade (mesma lógica de update_workout completo)
        if (parsedPlan.workouts.length > 1) {
          await db.workoutExercise.deleteMany({
            where: { workout: { unitId } },
          });
          await db.workout.deleteMany({ where: { unitId } });

          for (let i = 0; i < parsedPlan.workouts.length; i++) {
            const workoutPlan = parsedPlan.workouts[i];
            const newWorkout = await db.workout.create({
              data: {
                unitId,
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
          const workout = unit.workouts.find(
            (w) => w.id === parsedPlan.targetWorkoutId,
          );
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

              // Criar novo exercício
              const _exercises = await createExercisesInBatch(
                parsedPlan.targetWorkoutId,
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
        if (parsedPlan.workouts.length > 1) {
          // Novo comportamento: JSON completo. Para evitar timeout/erro de transação,
          // fazemos em série fora de transaction.
          await db.workoutExercise.deleteMany({
            where: { workout: { unitId } },
          });
          await db.workout.deleteMany({
            where: { unitId },
          });

          for (let i = 0; i < parsedPlan.workouts.length; i++) {
            const workoutPlan = parsedPlan.workouts[i];
            const newWorkout = await db.workout.create({
              data: {
                unitId,
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
          // Atualizar apenas o workout referenciado (modo antigo)
          const workoutPlan = parsedPlan.workouts[0];

          // Buscar workout pelo ID primeiro
          let targetWorkout = unit.workouts.find(
            (w) => w.id === parsedPlan.targetWorkoutId,
          );

          // Se não encontrou pelo ID, tentar pelo título (para workouts ainda não salvos nos previews)
          if (!targetWorkout) {
            targetWorkout = unit.workouts.find((w) => {
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
          } else {
            // Se não encontrou, pode ser um workout novo nos previews - criar novo
            console.log(
              `[update_workout] Workout não encontrado pelo ID/título "${parsedPlan.targetWorkoutId}", criando novo...`,
            );

            const lastOrder =
              unit.workouts.length > 0
                ? Math.max(...unit.workouts.map((w) => w.order ?? 0)) + 1
                : 0;

            const newWorkout = await db.workout.create({
              data: {
                unitId,
                title: workoutPlan.title,
                description: workoutPlan.description || "",
                type: workoutPlan.type,
                muscleGroup: workoutPlan.muscleGroup,
                difficulty: workoutPlan.difficulty,
                estimatedTime: 0,
                order: lastOrder,
              },
            });

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
  } catch (error: unknown) {
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
    } catch (exerciseError: unknown) {
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
      ) as unknown as MuscleGroup[],
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
