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

/**
 * Parseia resposta da IA e valida estrutura
 */
export function parseWorkoutResponse(response: string): ParsedWorkoutResponse {
  try {
    // Tentar extrair JSON da resposta
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("JSON não encontrado na resposta");
    }

    const parsed = JSON.parse(jsonMatch[0]);

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
      (workout: any, index: number) => {
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
            workout.difficulty
          )
        ) {
          throw new Error(`Workout ${index + 1}: dificuldade inválida`);
        }

        // Validar exercícios
        if (!Array.isArray(workout.exercises)) {
          throw new Error(
            `Workout ${index + 1}: exercícios devem ser um array`
          );
        }

        const validatedExercises: ParsedExercise[] = workout.exercises.map(
          (exercise: any, exIndex: number) => {
            if (!exercise.name || typeof exercise.name !== "string") {
              throw new Error(
                `Workout ${index + 1}, Exercício ${exIndex + 1}: nome inválido`
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

            const focus =
              exercise.focus &&
              ["quadriceps", "posterior"].includes(exercise.focus)
                ? exercise.focus
                : null;

            const alternatives =
              Array.isArray(exercise.alternatives) && exercise.alternatives.length > 0
                ? (exercise.alternatives as any[])
                    .filter((alt) => typeof alt === "string" && alt.trim().length > 0)
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
          }
        );

        return {
          title: workout.title.trim(),
          description: workout.description
            ? workout.description.trim()
            : undefined,
          type: workout.type,
          muscleGroup: workout.muscleGroup.trim(),
          difficulty: workout.difficulty,
          exercises: validatedExercises,
        };
      }
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
            old: String(parsed.exerciseToReplace.old),
            new: String(parsed.exerciseToReplace.new),
          }
        : undefined,
      message: parsed.message || "Comando processado com sucesso!",
    };
  } catch (error) {
    console.error("[parseWorkoutResponse] Erro ao parsear:", error);
    throw new Error(
      `Erro ao processar resposta da IA: ${
        error instanceof Error ? error.message : "Erro desconhecido"
      }`
    );
  }
}
