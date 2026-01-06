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

// --- Management Schemas ---

export const createUnitSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const updateUnitSchema = createUnitSchema.partial();

export const createWorkoutSchema = z.object({
  unitId: z.string().min(1, "O ID da unidade é obrigatório"),
  title: z.string().min(1, "O título é obrigatório"),
  description: z.string().optional(),
  type: z.string().default("strength"), // "strength", "cardio", etc.
  muscleGroup: z.string().min(1, "Grupo muscular é obrigatório"),
  difficulty: z.string().min(1, "Dificuldade é obrigatória"),
  estimatedTime: z.number().int().positive("Tempo estimado deve ser positivo"),
});

export const updateWorkoutSchema = createWorkoutSchema
  .omit({ unitId: true })
  .partial();

export const createWorkoutExerciseSchema = z.object({
  workoutId: z.string().min(1, "O ID do treino é obrigatório"),
  name: z.string().min(1, "O nome do exercício é obrigatório"),
  sets: z.number().int().positive("Séries devem ser positivas"),
  reps: z.string().min(1, "Repetições são obrigatórias"),
  rest: z.number().int().nonnegative("Descanso não pode ser negativo"),
  notes: z.string().optional(),
  videoUrl: z.string().optional(),
  educationalId: z.string().optional(),
  // Dados do educational database (aceita string JSON ou array)
  primaryMuscles: z.union([z.string(), z.array(z.string())]).optional(),
  secondaryMuscles: z.union([z.string(), z.array(z.string())]).optional(),
  difficulty: z.enum(["iniciante", "intermediario", "avancado"]).optional(),
  equipment: z.union([z.string(), z.array(z.string())]).optional(),
  instructions: z.union([z.string(), z.array(z.string())]).optional(),
  tips: z.union([z.string(), z.array(z.string())]).optional(),
  commonMistakes: z.union([z.string(), z.array(z.string())]).optional(),
  benefits: z.union([z.string(), z.array(z.string())]).optional(),
  scientificEvidence: z.string().optional(),
});

export const updateWorkoutExerciseSchema = createWorkoutExerciseSchema
  .omit({ workoutId: true })
  .partial();

export const completeWorkoutSchema = z.object({
  exerciseLogs: z.array(exerciseLogSchema).optional(),
  duration: z.number().int().nonnegative().optional(), // Permite 0 (não-negativo em vez de positivo)
  totalVolume: z.number().nonnegative().optional(),
  overallFeedback: z.enum(["excelente", "bom", "regular", "ruim"]).optional(),
  bodyPartsFatigued: z.array(z.string()).optional(),
  startTime: z.string().optional(), // Aceita qualquer string ISO datetime (será validado no handler)
  xpEarned: z.number().nonnegative().optional(), // Adicionado para consistência (já está sendo enviado)
});

export const saveWorkoutProgressSchema = z.object({
  currentExerciseIndex: z
    .number()
    .int()
    .min(0, "currentExerciseIndex deve ser >= 0"),
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
