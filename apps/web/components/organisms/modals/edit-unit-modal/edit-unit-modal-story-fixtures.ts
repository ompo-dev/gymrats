import type {
  PlanSlotData,
  WorkoutExercise,
  WorkoutSession,
} from "@/lib/types";

export const workoutExerciseFixture = {
  id: "exercise-1",
  name: "Supino Reto",
  sets: 4,
  reps: "8-10",
  rest: 90,
  notes: "Controlar a descida",
} as WorkoutExercise;

export const secondWorkoutExerciseFixture = {
  id: "exercise-2",
  name: "Crucifixo Inclinado",
  sets: 3,
  reps: "10-12",
  rest: 60,
} as WorkoutExercise;

export const workoutSessionFixture = {
  id: "workout-1",
  title: "Upper A",
  description: "Treino focado em peito e ombros",
  muscleGroup: "peito",
  difficulty: "intermediario",
  exercises: [workoutExerciseFixture, secondWorkoutExerciseFixture],
} as unknown as WorkoutSession;

export const secondWorkoutSessionFixture = {
  id: "workout-2",
  title: "Lower B",
  description: "Treino focado em pernas",
  muscleGroup: "pernas",
  difficulty: "intermediario",
  exercises: [
    {
      id: "exercise-3",
      name: "Agachamento Livre",
      sets: 4,
      reps: "6-8",
      rest: 120,
    },
  ],
} as unknown as WorkoutSession;

export const weeklyWorkoutSlotFixture = {
  id: "slot-1",
  dayOfWeek: 0,
  type: "workout",
  workout: workoutSessionFixture,
} as unknown as PlanSlotData;

export const weeklyRestSlotFixture = {
  id: "slot-2",
  dayOfWeek: 1,
  type: "rest",
  workout: null,
} as unknown as PlanSlotData;

export const weeklyPlanSlotsFixture = [
  weeklyWorkoutSlotFixture,
  weeklyRestSlotFixture,
] as PlanSlotData[];
