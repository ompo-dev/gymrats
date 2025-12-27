import { z } from "zod";

/**
 * Schemas de validação para rotas de workouts
 */

const exerciseSetSchema = z.object({
  weight: z.number().optional().nullable(),
  reps: z.number().int().positive().optional().nullable(),
  completed: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

const exerciseLogSchema = z.object({
  exerciseId: z.string().min(1, "exerciseId é obrigatório"),
  exerciseName: z.string().min(1, "exerciseName é obrigatório"),
  sets: z.array(exerciseSetSchema).optional(),
  notes: z.string().optional().nullable(),
  formCheckScore: z.number().min(0).max(10).optional().nullable(),
  difficulty: z
    .enum(["muito_facil", "facil", "medio", "dificil", "muito_dificil"])
    .optional()
    .nullable(),
});

export const completeWorkoutSchema = z.object({
  exerciseLogs: z.array(exerciseLogSchema).optional(),
  duration: z.number().int().positive().optional(),
  totalVolume: z.number().nonnegative().optional(),
  overallFeedback: z
    .enum(["excelente", "bom", "regular", "ruim"])
    .optional(),
  bodyPartsFatigued: z.array(z.string()).optional(),
  startTime: z.string().datetime().optional(),
});

export const saveWorkoutProgressSchema = z.object({
  currentExerciseIndex: z.number().int().min(0, "currentExerciseIndex deve ser >= 0"),
  exerciseLogs: z.array(exerciseLogSchema).optional(),
  skippedExercises: z.array(z.string()).optional(),
  selectedAlternatives: z.record(z.string()).optional(),
  xpEarned: z.number().nonnegative().optional(),
  totalVolume: z.number().nonnegative().optional(),
  completionPercentage: z.number().min(0).max(100).optional(),
  startTime: z.string().datetime().optional(),
  cardioPreference: z.string().optional().nullable(),
  cardioDuration: z.number().int().positive().optional().nullable(),
  selectedCardioType: z.string().optional().nullable(),
});

export const workoutHistoryQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const updateExerciseLogSchema = z.object({
  sets: z.array(exerciseSetSchema).optional(),
  notes: z.string().optional().nullable(),
  formCheckScore: z.number().min(0).max(10).optional().nullable(),
  difficulty: z
    .enum(["muito_facil", "facil", "medio", "dificil", "muito_dificil"])
    .optional()
    .nullable(),
});

