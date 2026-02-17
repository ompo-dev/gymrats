/**
 * Parser de Respostas da IA para Treinos
 *
 * A IA retorna comandos estruturados (criar, editar, deletar treinos/exercícios)
 * Parser valida e normaliza essas respostas
 */

export type WorkoutIntent = "create" | "edit" | "delete";
export type WorkoutAction =
  | "create_workouts"
  | "delete_workout"
  | "add_exercise"
  | "remove_exercise"
  | "replace_exercise"
  | "update_workout";

export interface ParsedExercise {
  name: string;
  sets: number;
  reps: string; // "8-12", "4-6", "15-20"
  rest: number; // segundos
  notes?: string;
  focus?: "quadriceps" | "posterior" | null; // Para treinos de pernas com foco específico
  alternatives?: string[]; // 2-3 alternativas obrigatórias
}

export interface ParsedWorkout {
  title: string;
  description?: string;
  type: "strength" | "cardio" | "flexibility";
  muscleGroup: string;
  difficulty: "iniciante" | "intermediario" | "avancado";
  exercises: ParsedExercise[];
}

export interface ParsedWorkoutResponse {
  intent: WorkoutIntent;
  action: WorkoutAction;
  workouts: ParsedWorkout[];
  targetWorkoutId?: string; // Para edições/deleções
  exerciseToRemove?: string; // Para remoção de exercício
  exerciseToReplace?: {
    old: string;
    new: string;
  }; // Para substituição de exercício
  message: string;
}

/** Estrutura bruta do exercício vindo da IA (não validada) */
interface RawParsedExercise {
  name?: string;
  sets?: number;
  reps?: string;
  rest?: number;
  notes?: string;
  focus?: string;
  alternatives?: (string | { name?: string })[];
}

/** Estrutura bruta do workout vindo da IA (não validada) */
interface RawParsedWorkout {
  title?: string;
  description?: string;
  type?: string;
  muscleGroup?: string;
  difficulty?: string;
  exercises?: RawParsedExercise[];
}

/** Estrutura bruta da resposta da IA (não validada) */
interface RawParsedWorkoutResponse {
  intent?: string;
  action?: string;
  workouts?: RawParsedWorkout[];
  targetWorkoutId?: string;
  exerciseToRemove?: string;
  exerciseToReplace?: { old?: string; new?: string };
  message?: string;
}

/**
 * Tenta reparar JSON truncado (ex.: cortado por max_tokens)
 * Fecha strings, arrays e objetos faltantes
 */
function tryRepairTruncatedJson(str: string): string {
  const trimmed = str.trim();
  const stack: Array<"{" | "["> = [];
  let inDoubleString = false;
  let isEscaped = false;

  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (c === "\\" && inDoubleString) {
      isEscaped = true;
      continue;
    }
    if (!inDoubleString) {
      if (c === "{") stack.push("{");
      else if (c === "[") stack.push("[");
      else if (c === "}") {
        if (stack[stack.length - 1] === "{") stack.pop();
      } else if (c === "]") {
        if (stack[stack.length - 1] === "[") stack.pop();
      } else if (c === '"') inDoubleString = true;
    } else if (c === '"') inDoubleString = false;
  }

  let suffix = "";
  if (inDoubleString) suffix += '"';
  while (stack.length > 0) {
    const open = stack.pop();
    suffix += open === "{" ? "}" : "]";
  }
  return trimmed + suffix;
}

/**
 * Extrai e parseia JSON da resposta, com fallback de repair para truncamento
 */
function extractAndParseJson(response: string): unknown {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("JSON não encontrado na resposta");
  }

  const jsonStr = jsonMatch[0];
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonStr);
  } catch (firstError) {
    // Tentar reparar JSON truncado (cortado por max_tokens)
    const repaired = tryRepairTruncatedJson(jsonStr);
    try {
      parsed = JSON.parse(repaired);
    } catch {
      throw new Error(
        `JSON inválido ou truncado. Tente um pedido mais curto ou divida em partes. Detalhe: ${
          firstError instanceof Error ? firstError.message : "parse falhou"
        }`,
      );
    }
  }

  return parsed;
}

/**
 * Parseia resposta da IA e valida estrutura
 */
export function parseWorkoutResponse(response: string): ParsedWorkoutResponse {
  try {
    const parsed = extractAndParseJson(response) as RawParsedWorkoutResponse;

    // Validar intent
    if (
      !parsed.intent ||
      !["create", "edit", "delete"].includes(parsed.intent)
    ) {
      throw new Error("Intent inválido");
    }

    // Validar action
    const validActions = [
      "create_workouts",
      "delete_workout",
      "add_exercise",
      "remove_exercise",
      "replace_exercise",
      "update_workout",
    ];
    if (!parsed.action || !validActions.includes(parsed.action)) {
      throw new Error("Action inválida");
    }

    // Validar workouts (sempre deve ser array, mesmo se vazio para delete_workout)
    if (!Array.isArray(parsed.workouts)) {
      throw new Error("workouts deve ser um array");
    }

    // Validar e normalizar cada workout
    const validatedWorkouts: ParsedWorkout[] = parsed.workouts.map(
      (workout: RawParsedWorkout, index: number) => {
        // Validar campos obrigatórios
        if (!workout.title || typeof workout.title !== "string") {
          throw new Error(`Workout ${index + 1}: título inválido`);
        }

        if (
          !workout.type ||
          !["strength", "cardio", "flexibility"].includes(workout.type)
        ) {
          throw new Error(`Workout ${index + 1}: tipo inválido`);
        }

        if (!workout.muscleGroup || typeof workout.muscleGroup !== "string") {
          throw new Error(`Workout ${index + 1}: grupo muscular inválido`);
        }

        if (
          !workout.difficulty ||
          !["iniciante", "intermediario", "avancado"].includes(
            workout.difficulty,
          )
        ) {
          throw new Error(`Workout ${index + 1}: dificuldade inválida`);
        }

        // Validar exercícios
        if (!Array.isArray(workout.exercises)) {
          throw new Error(
            `Workout ${index + 1}: exercícios devem ser um array`,
          );
        }

        const validatedExercises: ParsedExercise[] = workout.exercises.map(
          (exercise: RawParsedExercise, exIndex: number) => {
            if (!exercise.name || typeof exercise.name !== "string") {
              throw new Error(
                `Workout ${index + 1}, Exercício ${exIndex + 1}: nome inválido`,
              );
            }

            // Valores padrão para séries, repetições e descanso
            const sets =
              typeof exercise.sets === "number" && exercise.sets > 0
                ? exercise.sets
                : 3;

            const reps =
              typeof exercise.reps === "string" && exercise.reps
                ? exercise.reps
                : "8-12";

            const rest =
              typeof exercise.rest === "number" && exercise.rest >= 0
                ? exercise.rest
                : 60;

            const notes =
              typeof exercise.notes === "string" ? exercise.notes : undefined;

            const focus: ParsedExercise["focus"] =
              exercise.focus &&
              ["quadriceps", "posterior"].includes(exercise.focus)
                ? (exercise.focus as "quadriceps" | "posterior")
                : null;

            const alternatives =
              Array.isArray(exercise.alternatives) &&
              exercise.alternatives.length > 0
                ? exercise.alternatives
                    .filter(
                      (alt): alt is string =>
                        typeof alt === "string" && alt.trim().length > 0,
                    )
                    .slice(0, 3)
                    .map((alt) => alt.trim())
                : [];

            return {
              name: exercise.name.trim(),
              sets,
              reps,
              rest,
              notes,
              focus,
              alternatives,
            };
          },
        );

        return {
          title: workout.title.trim(),
          description: workout.description
            ? workout.description.trim()
            : undefined,
          type: workout.type as ParsedWorkout["type"],
          muscleGroup: workout.muscleGroup.trim(),
          difficulty: workout.difficulty as ParsedWorkout["difficulty"],
          exercises: validatedExercises,
        };
      },
    );

    return {
      intent: parsed.intent as WorkoutIntent,
      action: parsed.action as WorkoutAction,
      workouts: validatedWorkouts,
      targetWorkoutId: parsed.targetWorkoutId
        ? String(parsed.targetWorkoutId)
        : undefined,
      exerciseToRemove: parsed.exerciseToRemove
        ? String(parsed.exerciseToRemove)
        : undefined,
      exerciseToReplace: parsed.exerciseToReplace
        ? {
            old: String(parsed.exerciseToReplace.old ?? ""),
            new: String(parsed.exerciseToReplace.new ?? ""),
          }
        : undefined,
      message: parsed.message || "Comando processado com sucesso!",
    };
  } catch (error) {
    console.error("[parseWorkoutResponse] Erro ao parsear:", error);
    throw new Error(
      `Erro ao processar resposta da IA: ${
        error instanceof Error ? error.message : "Erro desconhecido"
      }`,
    );
  }
}
