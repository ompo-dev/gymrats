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

/** Schema base para create - usado para omit antes do refine */
const createWorkoutBaseSchema = z.object({
  unitId: z.string().optional(),
  planSlotId: z.string().optional(),
  title: z.string().min(1, "O título é obrigatório"),
  description: z.string().optional(),
  type: z.string().default("strength"),
  muscleGroup: z.string(),
  difficulty: z.string().min(1, "Dificuldade é obrigatória"),
  estimatedTime: z
    .number()
    .int()
    .nonnegative("Tempo estimado não pode ser negativo"),
});

export const createWorkoutSchema = createWorkoutBaseSchema.refine(
  (data) => data.unitId || data.planSlotId,
  {
    message: "unitId ou planSlotId é obrigatório",
    path: ["unitId"],
  },
);

export const updateWorkoutSchema = createWorkoutBaseSchema
  .omit({ unitId: true, planSlotId: true })
  .partial();

export const createWorkoutExerciseSchema = z.object({
  workoutId: z.string().min(1, "O ID do treino é obrigatório"),
  // educationalId agora é opcional e nullable - se não fornecido ou null, será gerado ou usado nome como ID
  educationalId: z.string().optional().nullable(),
  // name é obrigatório se educationalId não for fornecido
  name: z.string().min(1, "O nome do exercício é obrigatório"),
  sets: z.number().int().positive().optional(),
  reps: z.string().optional(),
  rest: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
  videoUrl: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
  // Dados do educational database (aceita string JSON ou array)
  primaryMuscles: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .nullable(),
  secondaryMuscles: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .nullable(),
  difficulty: z
    .enum(["iniciante", "intermediario", "avancado"])
    .optional()
    .nullable(),
  equipment: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .nullable(),
  instructions: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .nullable(),
  tips: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .nullable(),
  commonMistakes: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .nullable(),
  benefits: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .nullable(),
  scientificEvidence: z.string().optional().nullable(),
});

export const updateWorkoutExerciseSchema = createWorkoutExerciseSchema
  .omit({ workoutId: true })
  .partial();

// --- Weekly Plan Schemas ---

export const planSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  type: z.enum(["workout", "rest"]),
  workoutId: z.string().optional().nullable(),
});

export const createWeeklyPlanSchema = z.object({
  title: z.string().optional().default("Meu Plano Semanal"),
  isLibraryTemplate: z.boolean().optional().default(false),
  studentId: z.string().optional(), // Quando Gym/Personal cria
  sourceWeeklyPlanId: z.string().optional(), // Para clonar um plano existente
});

export const activateLibraryPlanSchema = z.object({
  libraryPlanId: z.string().min(1, "O ID do plano da biblioteca é obrigatório"),
});

export const updateWeeklyPlanSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  slots: z.array(planSlotSchema).length(7).optional(),
});

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

export const updateWorkoutProgressExerciseSchema = updateExerciseLogSchema;
