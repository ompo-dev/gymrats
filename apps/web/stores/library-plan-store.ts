"use client";

import { create } from "zustand";
import { apiClient } from "@/lib/api/client";
import type {
  DifficultyLevel,
  MuscleGroup,
  WorkoutExercise,
  WorkoutSession,
  WorkoutType,
} from "@/lib/types";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";

type LibraryMutationType = "plan" | "workout" | "exercise";

interface LibraryPlanMutationState {
  mutationLoadingByPlan: Record<string, boolean>;
  mutationTypeByPlan: Record<string, LibraryMutationType | null>;
  updatePlan: (params: {
    planId: string;
    payload: { title?: string; description?: string };
  }) => Promise<void>;
  addWorkoutToSlot: (params: {
    planId: string;
    payload: {
      planSlotId: string;
      title: string;
      description?: string;
      muscleGroup?: string;
      difficulty?: string;
      estimatedTime?: number;
      type?: string;
    };
  }) => Promise<string>;
  updateWorkout: (params: {
    planId: string;
    workoutId: string;
    payload: Record<string, unknown>;
  }) => Promise<void>;
  deleteWorkout: (params: {
    planId: string;
    workoutId: string;
  }) => Promise<void>;
  addWorkoutExercise: (params: {
    planId: string;
    workoutId: string;
    payload: Record<string, unknown>;
  }) => Promise<void>;
  updateWorkoutExercise: (params: {
    planId: string;
    exerciseId: string;
    payload: Record<string, unknown>;
  }) => Promise<void>;
  deleteWorkoutExercise: (params: {
    planId: string;
    exerciseId: string;
  }) => Promise<void>;
}

const setLibraryMutationState = (
  planId: string,
  type: LibraryMutationType | null,
  isLoading: boolean,
) => {
  useLibraryPlanStore.setState((state) => ({
    mutationLoadingByPlan: {
      ...state.mutationLoadingByPlan,
      [planId]: isLoading,
    },
    mutationTypeByPlan: {
      ...state.mutationTypeByPlan,
      [planId]: type,
    },
  }));
};

const updateStudentLibraryPlans = (
  updater: (
    plans: NonNullable<
      ReturnType<typeof useStudentUnifiedStore.getState>["data"]["libraryPlans"]
    >,
  ) => NonNullable<
    ReturnType<typeof useStudentUnifiedStore.getState>["data"]["libraryPlans"]
  >,
) => {
  useStudentUnifiedStore.setState((state) => ({
    data: {
      ...state.data,
      libraryPlans: updater(state.data.libraryPlans ?? []),
    },
  }));
};

const refreshLibraryViews = async () => {
  const studentStore = useStudentUnifiedStore.getState();
  await Promise.allSettled([
    studentStore.loadLibraryPlans(),
    studentStore.loadWeeklyPlan(true),
  ]);
};

const createOptimisticWorkout = (payload: {
  title: string;
  description?: string;
  muscleGroup?: string;
  difficulty?: string;
  estimatedTime?: number;
  type?: string;
}) => {
  const workoutId = `temp-library-workout-${Date.now()}`;
  const workout: WorkoutSession = {
    id: workoutId,
    title: payload.title,
    description: payload.description || "",
    type: (payload.type as WorkoutType) || "strength",
    muscleGroup: (payload.muscleGroup as MuscleGroup) || "peito",
    difficulty: (payload.difficulty as DifficultyLevel) || "iniciante",
    estimatedTime: payload.estimatedTime || 0,
    xpReward: 50,
    locked: false,
    completed: false,
    exercises: [],
  };
  return { workoutId, workout };
};

const patchWorkoutInLibraryPlans = (
  workoutId: string,
  updater: (workout: WorkoutSession) => WorkoutSession,
) => {
  updateStudentLibraryPlans((plans) =>
    plans.map((plan) => ({
      ...plan,
      slots: plan.slots.map((slot) => {
        if (
          slot.type !== "workout" ||
          !slot.workout ||
          slot.workout.id !== workoutId
        ) {
          return slot;
        }

        return {
          ...slot,
          workout: updater(slot.workout),
        };
      }),
    })),
  );
};

const removeWorkoutFromLibraryPlans = (workoutId: string) => {
  updateStudentLibraryPlans((plans) =>
    plans.map((plan) => ({
      ...plan,
      slots: plan.slots.map((slot) => {
        if (
          slot.type !== "workout" ||
          !slot.workout ||
          slot.workout.id !== workoutId
        ) {
          return slot;
        }

        return {
          ...slot,
          type: "rest",
          workout: undefined,
          completed: false,
          completedAt: undefined,
        };
      }),
    })),
  );
};

const patchExerciseInLibraryPlans = (
  exerciseId: string,
  updater: (exercise: WorkoutExercise) => WorkoutExercise | null,
) => {
  updateStudentLibraryPlans((plans) =>
    plans.map((plan) => ({
      ...plan,
      slots: plan.slots.map((slot) => {
        if (slot.type !== "workout" || !slot.workout) return slot;

        return {
          ...slot,
          workout: {
            ...slot.workout,
            exercises: slot.workout.exercises.flatMap((exercise) => {
              if (exercise.id !== exerciseId) return [exercise];
              const updated = updater(exercise);
              return updated ? [updated] : [];
            }),
          },
        };
      }),
    })),
  );
};

export const useLibraryPlanStore = create<LibraryPlanMutationState>(() => ({
  mutationLoadingByPlan: {},
  mutationTypeByPlan: {},

  updatePlan: async ({ planId, payload }) => {
    const previousPlans =
      useStudentUnifiedStore.getState().data.libraryPlans ?? [];
    setLibraryMutationState(planId, "plan", true);

    updateStudentLibraryPlans((plans) =>
      plans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              ...payload,
            }
          : plan,
      ),
    );

    try {
      await apiClient.patch(`/api/workouts/library/${planId}`, payload);
      await refreshLibraryViews();
    } catch (error) {
      useStudentUnifiedStore.setState((state) => ({
        data: {
          ...state.data,
          libraryPlans: previousPlans,
        },
      }));
      throw error;
    } finally {
      setLibraryMutationState(planId, null, false);
    }
  },

  addWorkoutToSlot: async ({ planId, payload }) => {
    const previousPlans =
      useStudentUnifiedStore.getState().data.libraryPlans ?? [];
    const { workoutId, workout } = createOptimisticWorkout(payload);

    setLibraryMutationState(planId, "workout", true);

    updateStudentLibraryPlans((plans) =>
      plans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              slots: plan.slots.map((slot) =>
                slot.id === payload.planSlotId
                  ? {
                      ...slot,
                      type: "workout",
                      workout,
                      locked: false,
                      completed: false,
                      completedAt: undefined,
                    }
                  : slot,
              ),
            }
          : plan,
      ),
    );

    try {
      const response = await apiClient.post<{
        data?: { id?: string };
        id?: string;
      }>("/api/workouts/manage", payload);
      const realId = response.data?.data?.id ?? response.data?.id ?? workoutId;

      patchWorkoutInLibraryPlans(workoutId, (currentWorkout) => ({
        ...currentWorkout,
        id: realId,
      }));

      await refreshLibraryViews();
      return realId;
    } catch (error) {
      useStudentUnifiedStore.setState((state) => ({
        data: {
          ...state.data,
          libraryPlans: previousPlans,
        },
      }));
      throw error;
    } finally {
      setLibraryMutationState(planId, null, false);
    }
  },

  updateWorkout: async ({ planId, workoutId, payload }) => {
    const previousPlans =
      useStudentUnifiedStore.getState().data.libraryPlans ?? [];
    setLibraryMutationState(planId, "workout", true);

    patchWorkoutInLibraryPlans(workoutId, (workout) => ({
      ...workout,
      ...payload,
    }));

    try {
      await apiClient.put(`/api/workouts/manage/${workoutId}`, payload);
      await refreshLibraryViews();
    } catch (error) {
      useStudentUnifiedStore.setState((state) => ({
        data: {
          ...state.data,
          libraryPlans: previousPlans,
        },
      }));
      throw error;
    } finally {
      setLibraryMutationState(planId, null, false);
    }
  },

  deleteWorkout: async ({ planId, workoutId }) => {
    const previousPlans =
      useStudentUnifiedStore.getState().data.libraryPlans ?? [];
    setLibraryMutationState(planId, "workout", true);

    removeWorkoutFromLibraryPlans(workoutId);

    try {
      await apiClient.delete(`/api/workouts/manage/${workoutId}`);
      await refreshLibraryViews();
    } catch (error) {
      useStudentUnifiedStore.setState((state) => ({
        data: {
          ...state.data,
          libraryPlans: previousPlans,
        },
      }));
      throw error;
    } finally {
      setLibraryMutationState(planId, null, false);
    }
  },

  addWorkoutExercise: async ({ planId, workoutId, payload }) => {
    const previousPlans =
      useStudentUnifiedStore.getState().data.libraryPlans ?? [];
    const tempExerciseId = `temp-library-exercise-${Date.now()}`;
    setLibraryMutationState(planId, "exercise", true);

    patchWorkoutInLibraryPlans(workoutId, (workout) => {
      const lastExercise = workout.exercises[workout.exercises.length - 1];
      const nextOrder = lastExercise ? (lastExercise.order || 0) + 1 : 0;

      return {
        ...workout,
        exercises: [
          ...workout.exercises,
          {
            id: tempExerciseId,
            name: String(payload.name ?? "Novo Exercicio"),
            sets: Number(payload.sets ?? 3),
            reps: String(payload.reps ?? "12"),
            rest: Number(payload.rest ?? 60),
            notes:
              typeof payload.notes === "string" ? payload.notes : undefined,
            order: nextOrder,
            educationalId:
              typeof payload.educationalId === "string"
                ? payload.educationalId
                : undefined,
          },
        ],
      };
    });

    try {
      const response = await apiClient.post<{
        data?: Record<string, unknown>;
      }>("/api/workouts/exercises", {
        workoutId,
        ...payload,
      });
      const realExercise = response.data?.data;
      const realId =
        realExercise && typeof realExercise.id === "string"
          ? realExercise.id
          : tempExerciseId;

      patchExerciseInLibraryPlans(tempExerciseId, (exercise) => ({
        ...exercise,
        id: realId,
        ...(realExercise ?? {}),
      }));

      await refreshLibraryViews();
    } catch (error) {
      useStudentUnifiedStore.setState((state) => ({
        data: {
          ...state.data,
          libraryPlans: previousPlans,
        },
      }));
      throw error;
    } finally {
      setLibraryMutationState(planId, null, false);
    }
  },

  updateWorkoutExercise: async ({ planId, exerciseId, payload }) => {
    const previousPlans =
      useStudentUnifiedStore.getState().data.libraryPlans ?? [];
    setLibraryMutationState(planId, "exercise", true);

    patchExerciseInLibraryPlans(exerciseId, (exercise) => ({
      ...exercise,
      ...payload,
    }));

    try {
      await apiClient.put(`/api/workouts/exercises/${exerciseId}`, payload);
      await refreshLibraryViews();
    } catch (error) {
      useStudentUnifiedStore.setState((state) => ({
        data: {
          ...state.data,
          libraryPlans: previousPlans,
        },
      }));
      throw error;
    } finally {
      setLibraryMutationState(planId, null, false);
    }
  },

  deleteWorkoutExercise: async ({ planId, exerciseId }) => {
    const previousPlans =
      useStudentUnifiedStore.getState().data.libraryPlans ?? [];
    setLibraryMutationState(planId, "exercise", true);

    patchExerciseInLibraryPlans(exerciseId, () => null);

    try {
      await apiClient.delete(`/api/workouts/exercises/${exerciseId}`);
      await refreshLibraryViews();
    } catch (error) {
      useStudentUnifiedStore.setState((state) => ({
        data: {
          ...state.data,
          libraryPlans: previousPlans,
        },
      }));
      throw error;
    } finally {
      setLibraryMutationState(planId, null, false);
    }
  },
}));
