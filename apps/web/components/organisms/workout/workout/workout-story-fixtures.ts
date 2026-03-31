import type { ExerciseLog, WorkoutExercise, WorkoutSession } from "@/lib/types";

export const strengthExerciseFixture = {
  id: "exercise-strength-1",
  name: "Supino Reto",
  sets: 4,
  reps: "8-10",
  rest: 90,
  notes: "Controlar a fase excêntrica.",
  educationalId: "education-1",
  alternatives: [{ id: "alt-1", name: "Chest Press" }],
} as unknown as WorkoutExercise;

export const cardioExerciseFixture = {
  id: "exercise-cardio-1",
  name: "Bike",
  reps: "20 min",
  rest: 0,
  alternatives: [],
} as unknown as WorkoutExercise;

export const completedExerciseLogFixture = {
  id: "log-1",
  exerciseId: "exercise-strength-1",
  exerciseName: "Supino Reto",
  sets: [
    {
      setNumber: 1,
      weight: 40,
      reps: 10,
      completed: true,
    },
    {
      setNumber: 2,
      weight: 42.5,
      reps: 8,
      completed: true,
    },
  ],
} as unknown as ExerciseLog;

export const workoutSessionFixture = {
  id: "workout-1",
  title: "Upper A",
  xpReward: 120,
  exercises: [strengthExerciseFixture, cardioExerciseFixture],
} as unknown as WorkoutSession;
