import { z } from "zod";

/**
 * Schemas de validação para rotas de students
 */

export const updateStudentProfileSchema = z.object({
  age: z.number().int().positive().optional().nullable(),
  gender: z.enum(["male", "female", "trans-male", "trans-female", "other"]).optional().nullable(),
  // Informações sobre identidade de gênero e terapia hormonal
  isTrans: z.boolean().optional().nullable(),
  usesHormones: z.boolean().optional().nullable(),
  hormoneType: z.enum(["testosterone", "estrogen", "none"]).optional().nullable(),
  height: z.number().positive().optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  fitnessLevel: z
    .enum(["iniciante", "intermediario", "avancado"])
    .optional()
    .nullable(),
  weeklyWorkoutFrequency: z.number().int().min(0).max(7).optional().nullable(),
  workoutDuration: z.number().int().positive().optional().nullable(),
  goals: z.array(z.string()).optional().nullable(),
  injuries: z.array(z.string()).optional().nullable(),
  availableEquipment: z.array(z.string()).optional().nullable(),
  gymType: z
    .enum(["home", "commercial", "outdoor"])
    .optional()
    .nullable(),
  preferredWorkoutTime: z
    .enum(["morning", "afternoon", "evening", "flexible"])
    .optional()
    .nullable(),
  preferredSets: z.number().int().positive().optional().nullable(),
  preferredRepRange: z.string().optional().nullable(),
  restTime: z.string().optional().nullable(),
  dietType: z.string().optional().nullable(),
  allergies: z.array(z.string()).optional().nullable(),
  targetCalories: z.number().int().positive().optional().nullable(),
  targetProtein: z.number().positive().optional().nullable(),
  targetCarbs: z.number().positive().optional().nullable(),
  targetFats: z.number().positive().optional().nullable(),
  mealsPerDay: z.number().int().positive().optional().nullable(),
  // Valores metabólicos calculados
  bmr: z.number().positive().optional().nullable(),
  tdee: z.number().positive().optional().nullable(),
  // Nível de atividade física (1-10)
  activityLevel: z.number().int().min(1).max(10).optional().nullable(),
  // Tempo de tratamento hormonal (meses)
  hormoneTreatmentDuration: z.number().int().min(0).max(120).optional().nullable(),
  // Limitações separadas
  physicalLimitations: z.array(z.string()).optional().nullable(),
  motorLimitations: z.array(z.string()).optional().nullable(),
  medicalConditions: z.array(z.string()).optional().nullable(),
  // Detalhes das limitações
  limitationDetails: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional().nullable(),
  // Horas disponíveis por dia para treino
  dailyAvailableHours: z.number().positive().max(24).optional().nullable(),
});

export const addWeightSchema = z.object({
  weight: z.number().positive("Peso deve ser maior que zero"),
  date: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  notes: z.string().optional().nullable(),
});

export const weightHistoryQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  startDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export const studentSectionsQuerySchema = z.object({
  sections: z.string().optional(),
});

export const updateStudentProgressSchema = z.object({
  totalXP: z.number().int().nonnegative().optional(),
  todayXP: z.number().int().nonnegative().optional(),
  workoutsCompleted: z.number().int().nonnegative().optional(),
  currentStreak: z.number().int().nonnegative().optional(),
  longestStreak: z.number().int().nonnegative().optional(),
  currentLevel: z.number().int().positive().optional(),
  xpToNextLevel: z.number().int().nonnegative().optional(),
  dailyGoalXP: z.number().int().positive().optional(),
  lastActivityDate: z.string().datetime().optional(),
});

