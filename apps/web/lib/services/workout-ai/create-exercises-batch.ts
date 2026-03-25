/**
 * Cria exercícios em batch para workouts gerados por IA
 */

import { db } from "@/lib/db";
import { exerciseDatabase } from "@/lib/educational-data/exercises";
import {
  calculateReps,
  calculateRest,
  calculateSets,
  generateAlternatives,
} from "@/lib/services/personalized-workout-generator";
import type { ExerciseInfo, MuscleGroup } from "@/lib/types";

export interface CreateExercisesProfile {
  preferredSets?: number | null;
  activityLevel?: number | null;
  fitnessLevel?: string | null;
  restTime?: string | null;
  preferredRepRange?: string | null;
  goals?: string | string[] | null;
  physicalLimitations?: string | string[] | null;
  motorLimitations?: string | string[] | null;
  medicalConditions?: string | string[] | null;
  gymType?: string | null;
}

export interface ExercisePlan {
  name: string;
  sets?: number;
  reps?: string;
  rest?: number;
  notes?: string;
  alternatives?: string[] | Array<{ name: string; reason?: string }>;
}

function parseStringArray(
  value: string | string[] | null | undefined,
): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

function findOrCreateExercise(exerciseName: string): ExerciseInfo {
  const normalizedName = exerciseName
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

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

  if (!exerciseInfo) {
    const generatedId = exerciseName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const inferMuscleGroup = (name: string): MuscleGroup[] => {
      const normalized = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const rules: Array<{ muscles: MuscleGroup[]; keywords: string[] }> = [
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
          keywords: ["ombros", "desenvolvimento", "elevacao", "elevação"],
        },
        {
          muscles: ["bracos"],
          keywords: [
            "triceps",
            "tríceps",
            "pulley",
            "biceps",
            "bíceps",
            "rosca",
          ],
        },
        {
          muscles: ["core"],
          keywords: ["abdominal", "abdomen", "core", "prancha"],
        },
      ];

      for (const rule of rules) {
        if (rule.keywords.some((kw) => normalized.includes(kw))) {
          return rule.muscles;
        }
      }
      return ["funcional"];
    };

    const inferEquipment = (name: string): string[] => {
      const normalized = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const rules: Array<{ equipment: string[]; keywords: string[] }> = [
        {
          equipment: ["Máquina"],
          keywords: ["maquina", "máquina", "cadeira", "leg press"],
        },
        { equipment: ["Barra", "Anilhas"], keywords: ["barra", "supino"] },
        { equipment: ["Halteres"], keywords: ["halter", "rosca"] },
        { equipment: ["Cabo", "Polia"], keywords: ["cabo", "pulley", "polia"] },
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
      primaryMuscles: inferMuscleGroup(exerciseName),
      secondaryMuscles: [],
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
      benefits: ["Desenvolvimento muscular", "Aumento de força"],
      scientificEvidence: undefined,
    };
  }

  return exerciseInfo as ExerciseInfo;
}

export async function createExercisesInBatch(
  workoutId: string,
  exercises: ExercisePlan[],
  profile: CreateExercisesProfile | null,
  defaultDifficulty: string,
  startOrder = 0,
  prismaClient: typeof db = db,
): Promise<Array<{ id: string; name: string }>> {
  const createdExercises = [];

  for (let i = 0; i < exercises.length; i++) {
    const exercisePlan = exercises[i];

    try {
      const exerciseInfo = findOrCreateExercise(exercisePlan.name);

      const calculatedSets =
        (exercisePlan.sets ?? 0) ||
        (profile
          ? calculateSets(
              profile.preferredSets,
              profile.activityLevel,
              profile.fitnessLevel,
            )
          : 3);
      const calculatedReps =
        exercisePlan.reps ||
        (profile
          ? calculateReps(
              profile.preferredRepRange,
              profile.goals
                ? typeof profile.goals === "string"
                  ? JSON.parse(profile.goals)
                  : profile.goals
                : [],
            )
          : "10");
      const calculatedRest =
        exercisePlan.rest !== undefined && exercisePlan.rest !== null
          ? exercisePlan.rest
          : profile
            ? calculateRest(profile.restTime, profile.preferredRepRange)
            : 60;

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
          primaryMuscles: exerciseInfo.primaryMuscles?.length
            ? JSON.stringify(exerciseInfo.primaryMuscles)
            : null,
          secondaryMuscles: exerciseInfo.secondaryMuscles?.length
            ? JSON.stringify(exerciseInfo.secondaryMuscles)
            : null,
          difficulty: exerciseInfo.difficulty || defaultDifficulty,
          equipment: exerciseInfo.equipment?.length
            ? JSON.stringify(exerciseInfo.equipment)
            : null,
          instructions: exerciseInfo.instructions?.length
            ? JSON.stringify(exerciseInfo.instructions)
            : null,
          tips: exerciseInfo.tips?.length
            ? JSON.stringify(exerciseInfo.tips)
            : null,
          commonMistakes: exerciseInfo.commonMistakes?.length
            ? JSON.stringify(exerciseInfo.commonMistakes)
            : null,
          benefits: exerciseInfo.benefits?.length
            ? JSON.stringify(exerciseInfo.benefits)
            : null,
          scientificEvidence: exerciseInfo.scientificEvidence || null,
        },
      });

      try {
        let alternativesToCreate: Array<{
          name: string;
          reason: string;
          educationalId: string | null;
        }> = [];

        if (
          exercisePlan.alternatives &&
          Array.isArray(exercisePlan.alternatives) &&
          exercisePlan.alternatives.length > 0
        ) {
          const altNames = exercisePlan.alternatives.map((a) =>
            typeof a === "string" ? a : a.name,
          );
          alternativesToCreate = altNames.slice(0, 3).map((altName) => ({
            name: altName.trim(),
            reason: "Alternativa sugerida pela IA",
            educationalId: null,
          }));
        } else if (profile && exerciseInfo) {
          const physicalLimitations = parseStringArray(
            profile.physicalLimitations,
          );
          const motorLimitations = parseStringArray(profile.motorLimitations);
          const medicalConditions = parseStringArray(profile.medicalConditions);
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

        if (alternativesToCreate.length > 0) {
          await db.alternativeExercise.createMany({
            data: alternativesToCreate.map((alt, index) => ({
              workoutExerciseId: exercise.id,
              name: alt.name,
              reason: alt.reason,
              educationalId: alt.educationalId,
              order: index,
            })),
          });
        }
      } catch (altError) {
        console.error(
          "[createExercisesInBatch] Erro ao adicionar alternativas:",
          altError,
        );
      }

      createdExercises.push(exercise);
    } catch (exerciseError) {
      console.error(
        `[createExercisesInBatch] Erro ao criar exercício ${exercisePlan.name}:`,
        exerciseError,
      );
    }
  }

  return createdExercises;
}
