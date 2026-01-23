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
  reps: string;
  rest: number;
  notes?: string;
  focus?: "quadriceps" | "posterior" | null;
  alternatives?: string[];
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
  targetWorkoutId?: string;
  exerciseToRemove?: string;
  exerciseToReplace?: {
    old: string;
    new: string;
  };
  message: string;
}

export function parseWorkoutResponse(response: string): ParsedWorkoutResponse {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("JSON não encontrado na resposta");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (
      !parsed.intent ||
      !["create", "edit", "delete"].includes(parsed.intent)
    ) {
      throw new Error("Intent inválido");
    }

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

    if (!Array.isArray(parsed.workouts)) {
      throw new Error("workouts deve ser um array");
    }

    const validatedWorkouts: ParsedWorkout[] = parsed.workouts.map(
      (workout: any, index: number) => {
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
