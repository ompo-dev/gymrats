/**
 * Serviço de Geração de Treinos Personalizados
 *
 * Gera treinos personalizados baseados em todos os dados coletados no onboarding:
 * - Dados pessoais (idade, gênero, altura, peso, nível de fitness)
 * - Objetivos (perder peso, ganhar massa, definir, etc)
 * - Preferências (séries, repetições, descanso)
 * - Equipamentos disponíveis (academia completa, básica, home gym, peso corporal)
 * - Nível de atividade física (1-10)
 * - Limitações físicas, motoras e condições médicas
 * - Frequência semanal e duração do treino
 */

import { db } from "@/lib/db";
import { exerciseDatabase } from "@/lib/educational-data";
import type { ExerciseInfo } from "@/lib/types";

interface OnboardingProfile {
  age?: number | null;
  gender?: string | null;
  fitnessLevel?: "iniciante" | "intermediario" | "avancado" | null;
  height?: number | null;
  weight?: number | null;
  goals?: string[];
  weeklyWorkoutFrequency?: number | null;
  workoutDuration?: number | null;
  preferredSets?: number | null;
  preferredRepRange?: "forca" | "hipertrofia" | "resistencia" | null;
  restTime?: "curto" | "medio" | "longo" | null;
  gymType?:
    | "academia-completa"
    | "academia-basica"
    | "home-gym"
    | "peso-corporal"
    | null;
  activityLevel?: number | null;
  physicalLimitations?: string[];
  motorLimitations?: string[];
  medicalConditions?: string[];
  limitationDetails?: Record<string, string | string[]> | null;
}

interface ExerciseSelection {
  exercise: ExerciseInfo;
  sets: number;
  reps: string;
  rest: number;
  notes?: string;
  alternatives: Array<{
    name: string;
    reason: string;
    educationalId?: string;
  }>;
}

interface WorkoutPlan {
  title: string;
  description: string;
  type: "strength" | "cardio" | "flexibility" | "rest";
  muscleGroup: string;
  difficulty: "iniciante" | "intermediario" | "avancado";
  exercises: ExerciseSelection[];
  estimatedTime: number;
  xpReward: number;
}

function getRestrictedMuscleGroups(limitations: string[]): string[] {
  const restricted: string[] = [];

  if (limitations.includes("pernas")) {
    restricted.push("pernas", "gluteos", "quadriceps", "posterior");
  }
  if (limitations.includes("bracos")) {
    restricted.push("bracos", "ombros", "triceps", "biceps");
  }
  if (limitations.includes("costas")) {
    restricted.push("costas", "lombar", "dorsal");
  }
  if (limitations.includes("articulacoes")) {
    restricted.push("ombros", "joelhos", "cotovelos", "pulsos");
  }
  if (limitations.includes("pescoco")) {
    restricted.push("pescoco", "trapezio");
  }

  return restricted;
}

function isExerciseCompatible(
  exercise: ExerciseInfo,
  physicalLimitations: string[],
  motorLimitations: string[],
  medicalConditions: string[]
): boolean {
  const restrictedMuscles = getRestrictedMuscleGroups(physicalLimitations);

  const primaryMuscles = exercise.primaryMuscles || [];
  const secondaryMuscles = exercise.secondaryMuscles || [];
  const allMuscles = [...primaryMuscles, ...secondaryMuscles];

  for (const muscle of allMuscles) {
    if (
      restrictedMuscles.some(
        (restricted) =>
          muscle.toLowerCase().includes(restricted.toLowerCase()) ||
          restricted.toLowerCase().includes(muscle.toLowerCase())
      )
    ) {
      return false;
    }
  }

  if (medicalConditions.includes("problemas-cardiacos")) {
    if (
      exercise.difficulty === "avancado" &&
      exercise.name.toLowerCase().includes("terra")
    ) {
      return false;
    }
  }

  if (medicalConditions.includes("asma")) {
    if (
      exercise.name.toLowerCase().includes("burpee") ||
      exercise.name.toLowerCase().includes("sprint")
    ) {
      return false;
    }
  }

  if (motorLimitations.includes("mobilidade-reduzida")) {
    if (
      exercise.name.toLowerCase().includes("agachamento") &&
      exercise.name.toLowerCase().includes("profundo")
    ) {
      return false;
    }
  }

  if (motorLimitations.includes("equilibrio")) {
    if (
      exercise.name.toLowerCase().includes("unilateral") ||
      exercise.name.toLowerCase().includes("pistol")
    ) {
      return false;
    }
  }

  return true;
}

function filterByEquipment(
  exercises: ExerciseInfo[],
  gymType: string | null | undefined
): ExerciseInfo[] {
  if (!gymType) return exercises;

  return exercises.filter((exercise) => {
    const equipment = exercise.equipment || [];

    switch (gymType) {
      case "academia-completa":
        return true;

      case "academia-basica":
        return !equipment.some((eq) =>
          ["Máquina Avançada", "Cable Machine", "Smith Machine"].includes(eq)
        );

      case "home-gym":
        return (
          equipment.some((eq) =>
            ["Halteres", "Barra", "Anilhas", "Banco"].includes(eq)
          ) || equipment.length === 0
        );

      case "peso-corporal":
        return (
          equipment.length === 0 ||
          equipment.every((eq) => eq === "Nenhum" || eq === "Peso Corporal")
        );

      default:
        return true;
    }
  });
}

export function calculateSets(
  preferredSets: number | null | undefined,
  activityLevel: number | null | undefined,
  fitnessLevel: string | null | undefined
): number {
  if (preferredSets) return preferredSets;

  if (activityLevel) {
    if (activityLevel >= 8) return 5;
    if (activityLevel >= 6) return 4;
    if (activityLevel >= 4) return 3;
    return 3;
  }

  if (fitnessLevel === "avancado") return 4;
  if (fitnessLevel === "intermediario") return 3;
  return 3;
}

export function calculateReps(
  preferredRepRange: string | null | undefined,
  goals: string[] | undefined
): string {
  if (preferredRepRange) {
    switch (preferredRepRange) {
      case "forca":
        return "4-6";
      case "hipertrofia":
        return "8-12";
      case "resistencia":
        return "15-20";
      default:
        return "8-12";
    }
  }

  if (goals && goals.length > 0) {
    if (goals.includes("forca")) {
      return "4-6";
    }
    if (goals.includes("resistencia")) {
      return "15-20";
    }
    if (goals.includes("ganhar-massa") || goals.includes("definir")) {
      return "8-12";
    }
  }

  return "8-12";
}

export function calculateRest(
  restTime: string | null | undefined,
  preferredRepRange: string | null | undefined
): number {
  if (restTime) {
    switch (restTime) {
      case "curto":
        return 30;
      case "medio":
        return 60;
      case "longo":
        return 90;
      default:
        return 60;
    }
  }

  if (preferredRepRange === "forca") return 120;
  if (preferredRepRange === "resistencia") return 30;
  return 60;
}

export function generateAlternatives(
  exercise: ExerciseInfo,
  gymType: string | null | undefined,
  limitations: string[]
): Array<{ name: string; reason: string; educationalId?: string }> {
  const alternatives: Array<{
    name: string;
    reason: string;
    educationalId?: string;
  }> = [];
  const usedNames = new Set<string>([exercise.name]);

  const primaryMuscleGroups = exercise.primaryMuscles;

  const sameMuscleGroupExercises = exerciseDatabase.filter((ex) => {
    const sharesPrimaryMuscle = ex.primaryMuscles.some((m) =>
      primaryMuscleGroups.includes(m)
    );
    const hasDifferentPrimary = ex.primaryMuscles.every(
      (m) => !primaryMuscleGroups.includes(m)
    );

    return (
      sharesPrimaryMuscle &&
      !hasDifferentPrimary &&
      ex.id !== exercise.id &&
      !usedNames.has(ex.name)
    );
  });

  if (gymType === "peso-corporal") {
    const bodyweightAlternatives = sameMuscleGroupExercises.filter(
      (ex) =>
        !ex.equipment ||
        ex.equipment.length === 0 ||
        ex.name.toLowerCase().includes("peso corporal") ||
        ex.name.toLowerCase().includes("flexão") ||
        ex.name.toLowerCase().includes("agachamento") ||
        ex.name.toLowerCase().includes("barra fixa")
    );

    if (bodyweightAlternatives.length > 0) {
      const alt = bodyweightAlternatives[0];
      alternatives.push({
        name: alt.name,
        reason: "Sem equipamento disponível",
        educationalId: alt.id,
      });
      usedNames.add(alt.name);
    }
  } else if (gymType === "academia-basica") {
    const basicAlternatives = sameMuscleGroupExercises.filter(
      (ex) =>
        !ex.equipment ||
        ex.equipment.includes("barra") ||
        ex.equipment.includes("halteres") ||
        ex.equipment.includes("banco")
    );

    if (basicAlternatives.length > 0) {
      const alt = basicAlternatives[0];
      alternatives.push({
        name: alt.name,
        reason: "Equipamento básico disponível",
        educationalId: alt.id,
      });
      usedNames.add(alt.name);
    }
  }

  if (limitations.includes("articulacoes")) {
    const lowImpactAlternatives = sameMuscleGroupExercises.filter(
      (ex) =>
        (ex.name.toLowerCase().includes("máquina") ||
          ex.name.toLowerCase().includes("cabo") ||
          ex.name.toLowerCase().includes("pulley")) &&
        !usedNames.has(ex.name)
    );

    if (lowImpactAlternatives.length > 0) {
      const alt = lowImpactAlternatives[0];
      alternatives.push({
        name: alt.name,
        reason: "Menor impacto nas articulações",
        educationalId: alt.id,
      });
      usedNames.add(alt.name);
    }
  }

  if (limitations.includes("costas")) {
    const backFriendlyAlternatives = sameMuscleGroupExercises.filter(
      (ex) =>
        !ex.name.toLowerCase().includes("remo") &&
        !ex.name.toLowerCase().includes("puxada") &&
        !ex.name.toLowerCase().includes("remada") &&
        !usedNames.has(ex.name)
    );

    if (backFriendlyAlternatives.length > 0) {
      const alt = backFriendlyAlternatives[0];
      alternatives.push({
        name: alt.name,
        reason: "Menor carga nas costas",
        educationalId: alt.id,
      });
      usedNames.add(alt.name);
    }
  }

  if (alternatives.length === 0 && sameMuscleGroupExercises.length > 0) {
    const similarDifficulty = sameMuscleGroupExercises.filter(
      (ex) =>
        ex.difficulty === exercise.difficulty ||
        (exercise.difficulty === "intermediario" &&
          ex.difficulty === "iniciante") ||
        (exercise.difficulty === "avancado" &&
          (ex.difficulty === "intermediario" || ex.difficulty === "iniciante"))
    );

    const bestMatches = (
      similarDifficulty.length > 0
        ? similarDifficulty
        : sameMuscleGroupExercises
    )
      .map((ex) => ({
        exercise: ex,
        sharedMuscles: ex.primaryMuscles.filter((m) =>
          primaryMuscleGroups.includes(m)
        ).length,
      }))
      .sort((a, b) => b.sharedMuscles - a.sharedMuscles);

    if (bestMatches.length > 0) {
      const targetExercise = bestMatches[0].exercise;
      alternatives.push({
        name: targetExercise.name,
        reason: "Alternativa para o mesmo grupo muscular",
        educationalId: targetExercise.id,
      });
      usedNames.add(targetExercise.name);
    }
  }

  if (
    alternatives.length < 2 &&
    sameMuscleGroupExercises.length > alternatives.length
  ) {
    const remaining = sameMuscleGroupExercises
      .filter((ex) => !usedNames.has(ex.name))
      .map((ex) => ({
        exercise: ex,
        sharedMuscles: ex.primaryMuscles.filter((m) =>
          primaryMuscleGroups.includes(m)
        ).length,
      }))
      .sort((a, b) => b.sharedMuscles - a.sharedMuscles);

    if (remaining.length > 0) {
      const alt = remaining[0].exercise;
      alternatives.push({
        name: alt.name,
        reason: "Alternativa similar",
        educationalId: alt.id,
      });
    }
  }

  return alternatives.slice(0, 2);
}

function selectExercisesForMuscleGroup(
  muscleGroup: string,
  profile: OnboardingProfile,
  count: number = 3,
  excludedMuscleGroups: string[] = [],
  alreadySelectedNames: Set<string> = new Set()
): ExerciseSelection[] {
  const {
    gymType,
    preferredSets,
    preferredRepRange,
    restTime,
    activityLevel,
    fitnessLevel,
    goals,
    physicalLimitations = [],
    motorLimitations = [],
    medicalConditions = [],
  } = profile;

  const forbiddenMuscleGroups = new Set(excludedMuscleGroups);

  let availableExercises = exerciseDatabase.filter((ex) => {
    const isPrimary = ex.primaryMuscles.includes(muscleGroup as any);
    const isSecondary =
      !isPrimary && ex.secondaryMuscles.includes(muscleGroup as any);

    const hasForbiddenPrimary = ex.primaryMuscles.some((m) =>
      forbiddenMuscleGroups.has(m)
    );
    const hasForbiddenSecondary = ex.secondaryMuscles.some(
      (m) => forbiddenMuscleGroups.has(m) && m !== muscleGroup
    );

    const alreadySelected = alreadySelectedNames.has(ex.name);

    return (
      (isPrimary || isSecondary) &&
      !hasForbiddenPrimary &&
      !hasForbiddenSecondary &&
      !alreadySelected
    );
  });

  availableExercises = filterByEquipment(availableExercises, gymType);

  availableExercises = availableExercises.filter((ex) =>
    isExerciseCompatible(
      ex,
      physicalLimitations,
      motorLimitations,
      medicalConditions
    )
  );

  const targetDifficulty = fitnessLevel || "iniciante";
  availableExercises = availableExercises.filter((ex) => {
    if (targetDifficulty === "iniciante") {
      return ex.difficulty === "iniciante" || ex.difficulty === "intermediario";
    }
    if (targetDifficulty === "intermediario") {
      return (
        ex.difficulty !== "avancado" || (activityLevel && activityLevel >= 7)
      );
    }
    return true;
  });

  const compoundExercises = availableExercises.filter(
    (ex) => ex.primaryMuscles.length > 1 || ex.secondaryMuscles.length > 0
  );
  const isolationExercises = availableExercises.filter(
    (ex) => ex.primaryMuscles.length === 1 && ex.secondaryMuscles.length === 0
  );

  const selected: ExerciseSelection[] = [];
  const selectedIds = new Set<string>();

  for (const exercise of compoundExercises.slice(0, Math.min(2, count))) {
    if (selectedIds.has(exercise.id)) continue;

    selected.push({
      exercise,
      sets: calculateSets(preferredSets, activityLevel, fitnessLevel),
      reps: calculateReps(preferredRepRange, goals),
      rest: calculateRest(restTime, preferredRepRange),
      notes: exercise.tips?.[0],
      alternatives: generateAlternatives(exercise, gymType, [
        ...physicalLimitations,
        ...motorLimitations,
      ]),
    });
    selectedIds.add(exercise.id);
  }

  for (const exercise of isolationExercises) {
    if (selected.length >= count) break;
    if (selectedIds.has(exercise.id)) continue;

    selected.push({
      exercise,
      sets: calculateSets(preferredSets, activityLevel, fitnessLevel),
      reps: calculateReps(preferredRepRange, goals),
      rest: calculateRest(restTime, preferredRepRange),
      notes: exercise.tips?.[0],
      alternatives: generateAlternatives(exercise, gymType, [
        ...physicalLimitations,
        ...motorLimitations,
      ]),
    });
    selectedIds.add(exercise.id);
  }

  return selected;
}

function determineSplit(weeklyFrequency: number | null | undefined): string[] {
  if (!weeklyFrequency) return ["full-body"];

  if (weeklyFrequency <= 2) {
    return ["full-body"];
  } else if (weeklyFrequency === 3) {
    return ["upper", "lower", "full-body"];
  } else if (weeklyFrequency === 4) {
    return ["upper", "lower", "upper", "lower"];
  } else if (weeklyFrequency === 5) {
    return ["push", "pull", "legs", "upper", "lower"];
  } else if (weeklyFrequency === 6) {
    return ["push", "pull", "legs", "push", "pull", "legs"];
  } else {
    return ["push", "pull", "legs", "upper", "lower", "full-body", "rest"];
  }
}

export async function generatePersonalizedWorkoutPlan(
  studentId: string,
  profile: OnboardingProfile
): Promise<void> {
  const {
    weeklyWorkoutFrequency = 3,
    workoutDuration = 45,
    fitnessLevel = "iniciante",
    goals = [],
    activityLevel = 5,
  } = profile;

  const split = determineSplit(weeklyWorkoutFrequency);
  const weeks = 4;
  const workoutsPerWeek = split.length;

  await db.unit.deleteMany({
    where: { studentId: studentId },
  });

  for (let week = 1; week <= weeks; week++) {
    const unit = await db.unit.create({
      data: {
        title: `Semana ${week}`,
        description:
          week === 1
            ? "Começando sua jornada fitness"
            : week === 2
            ? "Aumentando a intensidade"
            : week === 3
            ? "Treino avançado"
            : "Consolidação e progressão",
        color:
          week === 1
            ? "#58CC02"
            : week === 2
            ? "#1CB0F6"
            : week === 3
            ? "#FF9600"
            : "#9B59B6",
        icon: week === 1 ? "💪" : week === 2 ? "🔥" : week === 3 ? "⚡" : "🎯",
        order: week,
        studentId: studentId,
      },
    });

    for (let day = 0; day < workoutsPerWeek; day++) {
      const dayType = split[day];

      if (dayType === "rest") {
        continue;
      }

      let muscleGroups: string[] = [];
      let workoutTitle = "";
      let workoutDescription = "";
      let workoutType: "strength" | "cardio" | "flexibility" = "strength";

      switch (dayType) {
        case "full-body":
          muscleGroups = ["peito", "costas", "pernas", "ombros", "bracos"];
          workoutTitle = `Treino Completo - Dia ${String.fromCharCode(
            65 + day
          )}`;
          workoutDescription = "Treino completo para todo o corpo";
          break;
        case "upper":
          muscleGroups = ["peito", "costas", "ombros", "bracos"];
          workoutTitle = `Superiores - Dia ${String.fromCharCode(65 + day)}`;
          workoutDescription = "Treino focado em membros superiores";
          break;
        case "lower":
          muscleGroups = ["pernas", "gluteos"];
          workoutTitle = `Inferiores - Dia ${String.fromCharCode(65 + day)}`;
          workoutDescription = "Treino focado em membros inferiores";
          break;
        case "push":
          muscleGroups = ["peito", "ombros", "triceps"];
          workoutTitle = `Empurrar - Dia ${String.fromCharCode(65 + day)}`;
          workoutDescription = "Treino de movimentos de empurrar";
          break;
        case "pull":
          muscleGroups = ["costas", "biceps"];
          workoutTitle = `Puxar - Dia ${String.fromCharCode(65 + day)}`;
          workoutDescription = "Treino de movimentos de puxar";
          break;
        case "legs":
          muscleGroups = ["pernas", "gluteos"];
          workoutTitle = `Pernas - Dia ${String.fromCharCode(65 + day)}`;
          workoutDescription = "Treino completo de pernas";
          break;
      }

      if (goals.includes("perder-peso") || goals.includes("resistencia")) {
        if (day % 2 === 1) {
          workoutType = "cardio";
          muscleGroups = ["cardio"];
        }
      }

      const allExercises: ExerciseSelection[] = [];
      const selectedExerciseNames = new Set<string>();
      const selectedExerciseIds = new Set<string>();

      const excludedMuscleGroups: string[] = [];
      if (dayType === "upper" || dayType === "push" || dayType === "pull") {
        excludedMuscleGroups.push(
          "pernas",
          "gluteos",
          "quadriceps",
          "femoral",
          "panturrilha"
        );
      } else if (dayType === "lower" || dayType === "legs") {
        excludedMuscleGroups.push(
          "peito",
          "costas",
          "ombros",
          "biceps",
          "triceps"
        );
      }

      for (const muscleGroup of muscleGroups) {
        const exercises = selectExercisesForMuscleGroup(
          muscleGroup,
          profile,
          muscleGroups.length === 1 ? 4 : 2,
          excludedMuscleGroups,
          selectedExerciseNames
        );

        for (const ex of exercises) {
          if (
            !selectedExerciseNames.has(ex.exercise.name) &&
            !selectedExerciseIds.has(ex.exercise.id)
          ) {
            allExercises.push(ex);
            selectedExerciseNames.add(ex.exercise.name);
            selectedExerciseIds.add(ex.exercise.id);
          }
        }
      }

      const duration = workoutDuration ?? 45;
      const maxExercises = Math.floor(duration / 10);
      const selectedExercises = allExercises.slice(0, maxExercises);

      const estimatedTime =
        selectedExercises.reduce((total, ex) => {
          const exerciseTime =
            ex.sets * (parseInt(ex.reps.split("-")[0]) * 2) + ex.sets * ex.rest;
          return total + exerciseTime;
        }, 0) / 60;

      const baseXP =
        fitnessLevel === "avancado"
          ? 100
          : fitnessLevel === "intermediario"
          ? 75
          : 50;
      const xpReward = baseXP + selectedExercises.length * 5;

      const workout = await db.workout.create({
        data: {
          unitId: unit.id,
          title: workoutTitle,
          description: workoutDescription,
          type: workoutType,
          muscleGroup: muscleGroups[0] || "full-body",
          difficulty: fitnessLevel as
            | "iniciante"
            | "intermediario"
            | "avancado",
          xpReward,
          estimatedTime: Math.round(estimatedTime) || duration,
          order: day,
          locked: day > 0,
        },
      });

      for (let i = 0; i < selectedExercises.length; i++) {
        const exSelection = selectedExercises[i];
        const exerciseInfo = exSelection.exercise;

        const exercise = await db.workoutExercise.create({
          data: {
            workoutId: workout.id,
            name: exerciseInfo.name,
            sets: exSelection.sets,
            reps: exSelection.reps,
            rest: exSelection.rest,
            notes: exSelection.notes || null,
            educationalId: exerciseInfo.id,
            order: i,
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

        for (let j = 0; j < exSelection.alternatives.length; j++) {
          const alt = exSelection.alternatives[j];
          await db.alternativeExercise.create({
            data: {
              workoutExerciseId: exercise.id,
              name: alt.name,
              reason: alt.reason,
              educationalId: alt.educationalId || null,
              order: j,
            },
          });
        }
      }
    }
  }
}

export async function updateExercisesWithAlternatives(
  studentId: string
): Promise<void> {
  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { profile: true },
    });

    if (!student?.profile) {
      console.warn(
        `[updateExercisesWithAlternatives] Perfil não encontrado para studentId: ${studentId}`
      );
      return;
    }

    const limitations = [
      ...(student.profile.physicalLimitations
        ? JSON.parse(student.profile.physicalLimitations)
        : []),
      ...(student.profile.motorLimitations
        ? JSON.parse(student.profile.motorLimitations)
        : []),
    ];

    const units = await db.unit.findMany({
      where: { studentId },
      include: {
        workouts: {
          include: {
            exercises: {
              include: {
                alternatives: true,
              },
            },
          },
        },
      },
    });

    let updatedCount = 0;

    for (const unit of units) {
      for (const workout of unit.workouts) {
        for (const exercise of workout.exercises) {
          if (exercise.alternatives.length > 0) continue;

          const exerciseInfo = exerciseDatabase.find(
            (ex) =>
              ex.id === exercise.educationalId || ex.name === exercise.name
          );

          if (!exerciseInfo) {
            console.warn(
              `[updateExercisesWithAlternatives] Exercício não encontrado no database: ${exercise.name} (educationalId: ${exercise.educationalId})`
            );
            continue;
          }

          const alternatives = generateAlternatives(
            exerciseInfo,
            student.profile.gymType,
            limitations
          );

          for (let j = 0; j < alternatives.length; j++) {
            const alt = alternatives[j];
            await db.alternativeExercise.create({
              data: {
                workoutExerciseId: exercise.id,
                name: alt.name,
                reason: alt.reason,
                educationalId: alt.educationalId || null,
                order: j,
              },
            });
          }

          updatedCount++;
        }
      }
    }

    console.log(
      `[updateExercisesWithAlternatives] ${updatedCount} exercícios atualizados com alternativas`
    );
  } catch (error) {
    console.error("Erro ao atualizar exercícios com alternativas:", error);
    throw error;
  }
}

export async function hasPersonalizedWorkouts(
  studentId: string
): Promise<boolean> {
  const unitsCount = await db.unit.count({
    where: { studentId: studentId },
  });
  return unitsCount > 0;
}
