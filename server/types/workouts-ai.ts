/**
 * Tipos para handlers de workouts AI.
 */

import type { JsonValue } from "@/lib/types/api-error";

export interface WorkoutWithOrder {
	id: string;
	order?: number;
	exercises: WorkoutExerciseItem[];
	title?: string;
}

export interface WorkoutExerciseItem {
	id?: string;
	name: string;
	order?: number;
}

export interface ParsedWorkoutPlan {
	intent?: string;
	action?: string;
	workouts?: Array<{
		title?: string;
		name?: string;
		exercises?: Array<{
			name?: string;
			sets?: number;
			reps?: string;
			rest?: number;
			notes?: string;
			focus?: string | null;
			alternatives?: Array<{ name: string; reason?: string }>;
		}>;
	}>;
	targetWorkoutId?: string;
	exerciseToRemove?: string;
	exerciseToReplace?: { old: string; new?: string };
	message?: string;
}

export interface NormalizedExercise {
	name: string;
	sets: number;
	reps: string;
	rest: number;
	notes?: string;
	focus?: string | null;
	alternatives: Array<{ name: string; reason?: string }>;
}

export interface NormalizedWorkout {
	title: string;
	description: string;
	type: string;
	muscleGroup: string;
	difficulty: string;
	exercises: NormalizedExercise[];
}

export interface WorkoutsAiProfile {
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
	gymType?: string | null;
	activityLevel?: number | null;
	physicalLimitations?: string[];
	motorLimitations?: string[];
	medicalConditions?: string[];
	limitationDetails?: Record<string, string | string[]> | null;
}

/** Profile para createExercisesInBatch - aceita Prisma StudentProfile ou WorkoutsAiProfile */
export interface CreateExercisesProfile {
	preferredSets?: number | null;
	activityLevel?: number | null;
	fitnessLevel?: string | null;
	restTime?: string | null;
	preferredRepRange?: string | null;
	goals?: string | string[];
	physicalLimitations?: string | string[];
	motorLimitations?: string | string[];
	medicalConditions?: string | string[];
	gymType?: string | null;
}
