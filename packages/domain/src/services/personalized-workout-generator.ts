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

import { exerciseDatabase } from "@gymrats/catalog/exercises";
import { db } from "@gymrats/db";
import type { ExerciseInfo, MuscleGroup } from "@gymrats/types";
import { log } from "../log";

interface OnboardingProfile {
  // Dados pessoais
  age?: number | null;
  gender?: string | null;
  fitnessLevel?: "iniciante" | "intermediario" | "avancado" | null;
  height?: number | null;
  weight?: number | null;

  // Objetivos
  goals?: string[];
  weeklyWorkoutFrequency?: number | null;
  workoutDuration?: number | null; // minutos

  // Preferências
  preferredSets?: number | null;
  preferredRepRange?: "forca" | "hipertrofia" | "resistencia" | null;
  restTime?: "curto" | "medio" | "longo" | null;

  // Equipamentos
  gymType?:
    | "academia-completa"
    | "academia-basica"
    | "home-gym"
    | "peso-corporal"
    | null;

  // Atividade e limitações
  activityLevel?: number | null; // 1-10
  physicalLimitations?: string[];
  motorLimitations?: string[];
  medicalConditions?: string[];
  limitationDetails?: Record<string, string | string[]> | null;
}

interface ExerciseSelection {
  exercise: ExerciseInfo;
  sets: number;
  reps: string;
  rest: number; // segundos
  notes?: string;
  alternatives: Array<{
    name: string;
    reason: string;
    educationalId?: string;
  }>;
}

/**
 * Mapeia limitações físicas para grupos musculares a evitar
 */
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
    // Articulações podem afetar múltiplos grupos
    restricted.push("ombros", "joelhos", "cotovelos", "pulsos");
  }
  if (limitations.includes("pescoco")) {
    restricted.push("pescoco", "trapezio");
  }

  return restricted;
}

/**
 * Verifica se um exercício é compatível com as limitações
 */
function isExerciseCompatible(
  exercise: ExerciseInfo,
  physicalLimitations: string[],
  motorLimitations: string[],
  medicalConditions: string[],
): boolean {
  const restrictedMuscles = getRestrictedMuscleGroups(physicalLimitations);

  // Verificar se o exercício trabalha grupos musculares restritos
  const primaryMuscles = exercise.primaryMuscles || [];
  const secondaryMuscles = exercise.secondaryMuscles || [];
  const allMuscles = [...primaryMuscles, ...secondaryMuscles];

  for (const muscle of allMuscles) {
    if (
      restrictedMuscles.some(
        (restricted) =>
          muscle.toLowerCase().includes(restricted.toLowerCase()) ||
          restricted.toLowerCase().includes(muscle.toLowerCase()),
      )
    ) {
      return false;
    }
  }

  // Verificar condições médicas
  if (medicalConditions.includes("problemas-cardiacos")) {
    // Evitar exercícios muito intensos
    if (
      exercise.difficulty === "avancado" &&
      exercise.name.toLowerCase().includes("terra")
    ) {
      return false;
    }
  }

  if (medicalConditions.includes("asma")) {
    // Evitar exercícios de alta intensidade cardiovascular
    if (
      exercise.name.toLowerCase().includes("burpee") ||
      exercise.name.toLowerCase().includes("sprint")
    ) {
      return false;
    }
  }

  // Verificar limitações motoras
  if (motorLimitations.includes("mobilidade-reduzida")) {
    // Evitar exercícios que requerem muita mobilidade
    if (
      exercise.name.toLowerCase().includes("agachamento") &&
      exercise.name.toLowerCase().includes("profundo")
    ) {
      return false;
    }
  }

  if (motorLimitations.includes("equilibrio")) {
    // Evitar exercícios que requerem equilíbrio
    if (
      exercise.name.toLowerCase().includes("unilateral") ||
      exercise.name.toLowerCase().includes("pistol")
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Filtra exercícios baseado em equipamentos disponíveis
 */
function filterByEquipment(
  exercises: ExerciseInfo[],
  gymType: string | null | undefined,
): ExerciseInfo[] {
  if (!gymType) return exercises;

  return exercises.filter((exercise) => {
    const equipment = exercise.equipment || [];

    switch (gymType) {
      case "academia-completa":
        // Todos os exercícios disponíveis
        return true;

      case "academia-basica":
        // Apenas exercícios que não requerem equipamentos avançados
        return !equipment.some((eq) =>
          ["Máquina Avançada", "Cable Machine", "Smith Machine"].includes(eq),
        );

      case "home-gym":
        // Apenas exercícios com equipamentos básicos
        return (
          equipment.some((eq) =>
            ["Halteres", "Barra", "Anilhas", "Banco"].includes(eq),
          ) || equipment.length === 0
        );

      case "peso-corporal":
        // Apenas exercícios sem equipamento
        return (
          equipment.length === 0 ||
          equipment.every((eq) => eq === "Nenhum" || eq === "Peso Corporal")
        );

      default:
        return true;
    }
  });
}

/**
 * Calcula séries baseado em preferências e nível de atividade
 */
export function calculateSets(
  preferredSets: number | null | undefined,
  activityLevel: number | null | undefined,
  fitnessLevel: string | null | undefined,
): number {
  if (preferredSets) return preferredSets;

  // Baseado em nível de atividade
  if (activityLevel) {
    if (activityLevel >= 8) return 5; // Muito ativo
    if (activityLevel >= 6) return 4; // Ativo
    if (activityLevel >= 4) return 3; // Moderado
    return 3; // Sedentário
  }

  // Baseado em nível de fitness
  if (fitnessLevel === "avancado") return 4;
  if (fitnessLevel === "intermediario") return 3;
  return 3; // iniciante
}

/**
 * Calcula repetições baseado em preferências e objetivos
 */
export function calculateReps(
  preferredRepRange: string | null | undefined,
  goals: string[] | undefined,
): string {
  // SEMPRE usar preferredRepRange se fornecido (prioridade máxima)
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

  // Baseado em objetivos (fallback se não houver preferredRepRange)
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

  return "8-12"; // Padrão hipertrofia
}

/**
 * Calcula tempo de descanso baseado em preferências
 */
export function calculateRest(
  restTime: string | null | undefined,
  preferredRepRange: string | null | undefined,
): number {
  // SEMPRE usar restTime se fornecido (prioridade máxima)
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

  // Baseado em faixa de repetições (fallback se não houver restTime)
  if (preferredRepRange === "forca") return 120;
  if (preferredRepRange === "resistencia") return 30;
  return 60; // hipertrofia
}

/**
 * Gera alternativas para um exercício baseado em equipamentos e limitações
 * Sempre tenta gerar pelo menos 1-2 alternativas relevantes
 */
export function generateAlternatives(
  exercise: ExerciseInfo,
  gymType: string | null | undefined,
  limitations: string[],
): Array<{ name: string; reason: string; educationalId?: string }> {
  const alternatives: Array<{
    name: string;
    reason: string;
    educationalId?: string;
  }> = [];
  const usedNames = new Set<string>([exercise.name]); // Evitar duplicatas

  // 1. Buscar alternativas do MESMO grupo muscular PRIMÁRIO
  // Isso garante que alternativas sejam realmente relevantes
  const primaryMuscleGroups = exercise.primaryMuscles;

  const sameMuscleGroupExercises = exerciseDatabase.filter((ex) => {
    // Deve ter pelo menos um músculo primário em comum
    const sharesPrimaryMuscle = ex.primaryMuscles.some((m) =>
      primaryMuscleGroups.includes(m),
    );

    // Não pode ser o mesmo exercício
    // Não pode ter músculos primários completamente diferentes
    const hasDifferentPrimary = ex.primaryMuscles.every(
      (m) => !primaryMuscleGroups.includes(m),
    );

    return (
      sharesPrimaryMuscle &&
      !hasDifferentPrimary &&
      ex.id !== exercise.id &&
      !usedNames.has(ex.name)
    );
  });

  // 2. Alternativas baseadas em equipamentos disponíveis
  if (gymType === "peso-corporal") {
    // Se for exercício com equipamento, sugerir versão peso corporal
    const bodyweightAlternatives = sameMuscleGroupExercises.filter(
      (ex) =>
        !ex.equipment ||
        ex.equipment.length === 0 ||
        ex.name.toLowerCase().includes("peso corporal") ||
        ex.name.toLowerCase().includes("flexão") ||
        ex.name.toLowerCase().includes("agachamento") ||
        ex.name.toLowerCase().includes("barra fixa"),
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
    // Para academia básica, sugerir alternativas com equipamentos simples
    const basicAlternatives = sameMuscleGroupExercises.filter(
      (ex) =>
        !ex.equipment ||
        ex.equipment.includes("barra") ||
        ex.equipment.includes("halteres") ||
        ex.equipment.includes("banco"),
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

  // 3. Alternativas baseadas em limitações físicas
  if (limitations.includes("articulacoes")) {
    // Sugerir versões de menor impacto (máquinas, cabos)
    const lowImpactAlternatives = sameMuscleGroupExercises.filter(
      (ex) =>
        (ex.name.toLowerCase().includes("máquina") ||
          ex.name.toLowerCase().includes("cabo") ||
          ex.name.toLowerCase().includes("pulley")) &&
        !usedNames.has(ex.name),
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
    // Evitar exercícios que sobrecarregam as costas
    const backFriendlyAlternatives = sameMuscleGroupExercises.filter(
      (ex) =>
        !ex.name.toLowerCase().includes("remo") &&
        !ex.name.toLowerCase().includes("puxada") &&
        !ex.name.toLowerCase().includes("remada") &&
        !usedNames.has(ex.name),
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

  // 4. Sempre adicionar pelo menos uma alternativa genérica do mesmo grupo muscular
  // se ainda não tiver alternativas suficientes
  if (alternatives.length === 0 && sameMuscleGroupExercises.length > 0) {
    // Priorizar exercícios com dificuldade similar ou menor
    const similarDifficulty = sameMuscleGroupExercises.filter(
      (ex) =>
        ex.difficulty === exercise.difficulty ||
        (exercise.difficulty === "intermediario" &&
          ex.difficulty === "iniciante") ||
        (exercise.difficulty === "avancado" &&
          (ex.difficulty === "intermediario" || ex.difficulty === "iniciante")),
    );

    // Priorizar exercícios que compartilham mais músculos primários
    const bestMatches = (
      similarDifficulty.length > 0
        ? similarDifficulty
        : sameMuscleGroupExercises
    )
      .map((ex) => ({
        exercise: ex,
        sharedMuscles: ex.primaryMuscles.filter((m) =>
          primaryMuscleGroups.includes(m),
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

  // 5. Adicionar mais uma alternativa se possível (máximo 2 alternativas)
  // Priorizar exercícios que compartilham mais músculos primários
  if (
    alternatives.length < 2 &&
    sameMuscleGroupExercises.length > alternatives.length
  ) {
    const remaining = sameMuscleGroupExercises
      .filter((ex) => !usedNames.has(ex.name))
      .map((ex) => ({
        exercise: ex,
        sharedMuscles: ex.primaryMuscles.filter((m) =>
          primaryMuscleGroups.includes(m),
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

  // Limitar a 2 alternativas no máximo
  return alternatives.slice(0, 2);
}

/**
 * Seleciona exercícios para um grupo muscular específico
 */
function normalizeMuscleGroup(input: string): MuscleGroup {
  switch (input) {
    case "biceps":
    case "triceps":
      return "bracos";
    case "quadriceps":
    case "femoral":
    case "panturrilha":
      return "pernas";
    default:
      return input as MuscleGroup;
  }
}

function selectExercisesForMuscleGroup(
  muscleGroup: string,
  profile: OnboardingProfile,
  count: number = 3,
  excludedMuscleGroups: string[] = [], // Grupos musculares a evitar (ex: pernas em treino de superiores)
  alreadySelectedNames: Set<string> = new Set(), // Nomes de exercícios já selecionados
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

  // Definir grupos musculares que não devem aparecer
  const normalizedMuscleGroup = normalizeMuscleGroup(muscleGroup);
  const forbiddenMuscleGroups = new Set(
    excludedMuscleGroups.map(normalizeMuscleGroup),
  );

  // Filtrar exercícios por grupo muscular
  // Priorizar exercícios onde o grupo muscular é PRIMÁRIO, não secundário
  let availableExercises = exerciseDatabase.filter((ex) => {
    // O grupo muscular deve estar nos músculos primários (prioridade)
    const isPrimary = ex.primaryMuscles.includes(normalizedMuscleGroup);
    // Ou pelo menos nos secundários se não houver primários
    const isSecondary =
      !isPrimary && ex.secondaryMuscles.includes(normalizedMuscleGroup);

    // Não pode ter grupos musculares proibidos nos primários
    const hasForbiddenPrimary = ex.primaryMuscles.some((m) =>
      forbiddenMuscleGroups.has(m),
    );
    // Não pode ter grupos musculares proibidos nos secundários (a menos que seja o grupo alvo)
    const hasForbiddenSecondary = ex.secondaryMuscles.some(
      (m) => forbiddenMuscleGroups.has(m) && m !== normalizedMuscleGroup,
    );

    // Não pode ser um exercício já selecionado
    const alreadySelected = alreadySelectedNames.has(ex.name);

    return (
      (isPrimary || isSecondary) &&
      !hasForbiddenPrimary &&
      !hasForbiddenSecondary &&
      !alreadySelected
    );
  });

  // Filtrar por equipamentos
  availableExercises = filterByEquipment(availableExercises, gymType);

  // Filtrar por limitações
  availableExercises = availableExercises.filter((ex) =>
    isExerciseCompatible(
      ex,
      physicalLimitations,
      motorLimitations,
      medicalConditions,
    ),
  );

  // Filtrar por nível de dificuldade
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
    return true; // avançado pode fazer qualquer exercício
  });

  // Selecionar os melhores exercícios (priorizar exercícios compostos)
  const compoundExercises = availableExercises.filter(
    (ex) => ex.primaryMuscles.length > 1 || ex.secondaryMuscles.length > 0,
  );
  const isolationExercises = availableExercises.filter(
    (ex) => ex.primaryMuscles.length === 1 && ex.secondaryMuscles.length === 0,
  );

  const selected: ExerciseSelection[] = [];
  const selectedIds = new Set<string>();

  // Adicionar exercícios compostos primeiro
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

  // Adicionar exercícios de isolamento
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

/**
 * Determina a divisão de treino baseada em frequência semanal
 */
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

/**
 * Gera um plano de treino mensal personalizado
 */
export async function generatePersonalizedWorkoutPlan(
  studentId: string,
  profile: OnboardingProfile,
): Promise<void> {
  const {
    weeklyWorkoutFrequency = 3,
    workoutDuration = 45,
    fitnessLevel = "iniciante",
    goals = [],
  } = profile;

  // Determinar divisão de treino
  const split = determineSplit(weeklyWorkoutFrequency);

  // Calcular número de semanas (4 semanas = 1 mês)
  const weeks = 4;
  const workoutsPerWeek = split.length;

  // Deletar treinos personalizados antigos do aluno (se existirem)
  await db.unit.deleteMany({
    where: { studentId: studentId },
  });

  // Criar units (semanas)
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
        studentId: studentId, // Associar ao aluno
      },
    });

    // Criar workouts para cada dia da semana
    for (let day = 0; day < workoutsPerWeek; day++) {
      const dayType = split[day];

      // Pular dia de descanso
      if (dayType === "rest") {
        continue;
      }

      // Determinar grupos musculares baseado no tipo de dia
      let muscleGroups: string[] = [];
      let workoutTitle = "";
      let workoutDescription = "";
      let workoutType: "strength" | "cardio" | "flexibility" = "strength";

      switch (dayType) {
        case "full-body":
          muscleGroups = ["peito", "costas", "pernas", "ombros", "bracos"];
          workoutTitle = `Treino Completo - Dia ${String.fromCharCode(
            65 + day,
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

      // Adicionar cardio se objetivo incluir perder peso ou resistência
      if (goals.includes("perder-peso") || goals.includes("resistencia")) {
        if (day % 2 === 1) {
          // Dias alternados
          workoutType = "cardio";
          muscleGroups = ["cardio"];
        }
      }

      // Selecionar exercícios para cada grupo muscular
      const allExercises: ExerciseSelection[] = [];
      const selectedExerciseNames = new Set<string>(); // Tracking de exercícios já selecionados
      const selectedExerciseIds = new Set<string>(); // Tracking de IDs para evitar duplicatas

      // Determinar grupos musculares a evitar baseado no tipo de treino
      const excludedMuscleGroups: string[] = [];
      if (dayType === "upper" || dayType === "push" || dayType === "pull") {
        // Em treinos de superiores, excluir pernas e glúteos
        excludedMuscleGroups.push(
          "pernas",
          "gluteos",
          "quadriceps",
          "femoral",
          "panturrilha",
        );
      } else if (dayType === "lower" || dayType === "legs") {
        // Em treinos de inferiores, excluir grupos de superiores (exceto core que pode aparecer)
        excludedMuscleGroups.push(
          "peito",
          "costas",
          "ombros",
          "biceps",
          "triceps",
        );
      }

      for (const muscleGroup of muscleGroups) {
        const exercises = selectExercisesForMuscleGroup(
          muscleGroup,
          profile,
          muscleGroups.length === 1 ? 4 : 2, // Mais exercícios se for treino focado
          excludedMuscleGroups, // Passar grupos a evitar
          selectedExerciseNames, // Passar exercícios já selecionados
        );

        // Adicionar apenas exercícios únicos
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

      // Limitar número de exercícios baseado em duração
      const duration = workoutDuration ?? 45; // Garantir que não seja null
      const maxExercises = Math.floor(duration / 10); // ~10 min por exercício
      const selectedExercises = allExercises.slice(0, maxExercises);

      // Calcular tempo estimado
      const estimatedTime =
        selectedExercises.reduce((total, ex) => {
          const exerciseTime =
            ex.sets * (parseInt(ex.reps.split("-")[0], 10) * 2) +
            ex.sets * ex.rest;
          return total + exerciseTime;
        }, 0) / 60; // Converter para minutos

      // Calcular XP baseado em dificuldade e número de exercícios
      const baseXP =
        fitnessLevel === "avancado"
          ? 100
          : fitnessLevel === "intermediario"
            ? 75
            : 50;
      const xpReward = baseXP + selectedExercises.length * 5;

      // Criar workout
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
          estimatedTime: Math.round(estimatedTime) || duration, // Usar duration que já garante não ser null
          order: day,
          locked: day > 0, // Primeiro workout desbloqueado
        },
      });

      // Criar exercícios
      for (let i = 0; i < selectedExercises.length; i++) {
        const exSelection = selectedExercises[i];
        const exerciseInfo = exSelection.exercise;

        const exercise = await db.workoutExercise.create({
          data: {
            workoutId: workout.id,
            name: exerciseInfo.name,
            sets: exSelection.sets, // Usa preferredSets do onboarding
            reps: exSelection.reps, // Usa preferredRepRange do onboarding
            rest: exSelection.rest, // Usa restTime do onboarding
            notes: exSelection.notes || null,
            educationalId: exerciseInfo.id,
            order: i,
            // Dados do educational database
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

        // Criar alternativas
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

/**
 * Atualiza exercícios existentes com alternativas
 * Útil para adicionar alternativas a treinos já gerados
 */
export async function updateExercisesWithAlternatives(
  studentId: string,
): Promise<void> {
  try {
    // Buscar perfil do aluno uma única vez (fora do loop)
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { profile: true },
    });

    if (!student?.profile) {
      log.warn("[updateExercisesWithAlternatives] Perfil não encontrado", {
        studentId,
      });
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

    // Buscar todos os workouts do aluno
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
          // Se já tem alternativas, pular
          if (exercise.alternatives.length > 0) continue;

          // Buscar o exercício no database educacional
          const exerciseInfo = exerciseDatabase.find(
            (ex) =>
              ex.id === exercise.educationalId || ex.name === exercise.name,
          );

          if (!exerciseInfo) {
            log.warn(
              "[updateExercisesWithAlternatives] Exercício não encontrado no database",
              { name: exercise.name, educationalId: exercise.educationalId },
            );
            continue;
          }

          // Gerar alternativas
          const alternatives = generateAlternatives(
            exerciseInfo,
            student.profile.gymType,
            limitations,
          );

          // Criar alternativas no banco
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

    log.info("[updateExercisesWithAlternatives] Exercícios atualizados", {
      updatedCount,
    });
  } catch (error) {
    log.error("Erro ao atualizar exercícios com alternativas", { error });
    throw error;
  }
}

/**
 * Verifica se o aluno já tem treinos personalizados
 */
export async function hasPersonalizedWorkouts(
  studentId: string,
): Promise<boolean> {
  // Verificar se há units criadas para este aluno específico
  const unitsCount = await db.unit.count({
    where: { studentId: studentId },
  });
  return unitsCount > 0;
}
