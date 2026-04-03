"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useModalStateWithParam } from "@/hooks/use-modal-state";
import { useStudent } from "@/hooks/use-student";
import { log } from "@/lib/observability/logger";
import type {
  MuscleGroup,
  PlanSlotData,
  WeeklyPlanData,
  WorkoutExercise,
  WorkoutSession,
} from "@/lib/types";
import { useLibraryPlanStore } from "@/stores/library-plan-store";
import { useStudentDetailStore } from "@/stores/student-detail-store";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";

export const DAY_NAMES = [
  "Segunda",
  "Terca",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sabado",
  "Domingo",
] as const;

export interface UseEditUnitModalProps {
  isWeeklyPlanMode?: boolean;
  isLibraryMode?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onPlanUpdated?: () => void | Promise<void>;
  apiMode?: "student" | "gym";
  studentId?: string;
  weeklyPlan?: WeeklyPlanData | null;
  loadWeeklyPlan?: (force?: boolean) => Promise<void>;
}

function hasSameOrderedIds(
  current: Array<{ id: string }> | null,
  next: Array<{ id: string }>,
) {
  if (current == null) return false;
  if (current.length !== next.length) return false;
  return current.every((item, index) => item.id === next[index]?.id);
}

export function useEditUnitModal({
  isWeeklyPlanMode = false,
  isLibraryMode = false,
  isOpen: isOpenProp,
  onClose: onCloseProp,
  onPlanUpdated,
  apiMode = "student",
  studentId,
  weeklyPlan: weeklyPlanOverride,
  loadWeeklyPlan: loadWeeklyPlanOverride,
}: UseEditUnitModalProps = {}) {
  const {
    isOpen: isOpenEditUnit,
    close: closeEditUnit,
    paramValue: unitId,
  } = useModalStateWithParam("editUnit", "unitId");

  const isGymMode = apiMode === "gym";
  const actions = useStudent("actions");
  const storeWeeklyPlan = useStudent(
    "weeklyPlan",
  ) as unknown as WeeklyPlanData | null;
  const storeLoaders = useStudent("loaders");

  const weeklyPlan: WeeklyPlanData | null = isGymMode
    ? (weeklyPlanOverride ?? null)
    : isLibraryMode
      ? (weeklyPlanOverride ?? null)
      : storeWeeklyPlan;

  const loadWeeklyPlan = isGymMode
    ? loadWeeklyPlanOverride
    : storeLoaders.loadWeeklyPlan;

  const isOpen = isWeeklyPlanMode ? (isOpenProp ?? false) : isOpenEditUnit;
  const close = isWeeklyPlanMode ? (onCloseProp ?? (() => {})) : closeEditUnit;

  const sourcePlanSlots = useMemo<PlanSlotData[]>(() => {
    if (!weeklyPlan?.slots) return [];
    return Array.isArray(weeklyPlan.slots)
      ? (weeklyPlan.slots as PlanSlotData[])
      : [];
  }, [weeklyPlan?.slots]);

  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [showWorkoutChat, setShowWorkoutChat] = useState(false);
  const [loadingSlotId, setLoadingSlotId] = useState<string | null>(null);
  const [chatSlotId, setChatSlotId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [workoutMuscleGroup, setWorkoutMuscleGroup] = useState<string>("");
  const requiresLocalListDraft = isGymMode || isLibraryMode;
  const requiresLocalPlanSlotsDraft =
    isWeeklyPlanMode && requiresLocalListDraft;
  const [planSlotsDraft, setPlanSlotsDraft] = useState<PlanSlotData[] | null>(
    null,
  );
  const [workoutItemsDraft, setWorkoutItemsDraft] = useState<
    WorkoutSession[] | null
  >(null);
  const [exerciseItemsDraft, setExerciseItemsDraft] = useState<
    WorkoutExercise[] | null
  >(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<
    string | null
  >(null);
  const [deleteWorkoutConfirmationId, setDeleteWorkoutConfirmationId] =
    useState<string | null>(null);
  const [weeklyPlanSlotsKey, setWeeklyPlanSlotsKey] = useState(0);
  const planSlotsDraftSourceIdRef = useRef<string | null>(null);
  const lastHydratedUnitSnapshotRef = useRef<string | null>(null);

  const unit = useStudentUnifiedStore(
    (state) =>
      state.data.units.find((currentUnit) => currentUnit.id === unitId) || null,
  );

  const sortedWorkouts = useMemo(() => {
    if (!unit?.workouts?.length) return [];
    return [...unit.workouts].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [unit?.workouts]);

  const planSlots = useMemo(
    () =>
      requiresLocalPlanSlotsDraft
        ? (planSlotsDraft ?? sourcePlanSlots)
        : sourcePlanSlots,
    [planSlotsDraft, requiresLocalPlanSlotsDraft, sourcePlanSlots],
  );

  const exercisesRawFromStore = useStudentUnifiedStore((state) => {
    if (!editingWorkoutId || !unitId) return null;
    const currentUnit = state.data.units.find(
      (candidate) => candidate.id === unitId,
    );
    const currentWorkout = currentUnit?.workouts.find(
      (candidate) => candidate.id === editingWorkoutId,
    );
    return currentWorkout?.exercises ?? null;
  });

  const exercisesRawFromWeeklyPlan = useMemo(() => {
    if (!isWeeklyPlanMode || !editingWorkoutId) return null;
    const slot = planSlots.find(
      (candidate) => candidate.workout?.id === editingWorkoutId,
    );
    return slot?.workout?.exercises ?? null;
  }, [editingWorkoutId, isWeeklyPlanMode, planSlots]);

  const exercises = useMemo(
    () =>
      (isWeeklyPlanMode ? exercisesRawFromWeeklyPlan : exercisesRawFromStore) ??
      [],
    [exercisesRawFromStore, exercisesRawFromWeeklyPlan, isWeeklyPlanMode],
  );

  const activeWorkout = useMemo(() => {
    if (isWeeklyPlanMode && editingWorkoutId) {
      const slot = planSlots.find(
        (candidate) => candidate.workout?.id === editingWorkoutId,
      );
      return slot?.workout ?? null;
    }

    return (
      sortedWorkouts.find((workout) => workout.id === editingWorkoutId) ?? null
    );
  }, [editingWorkoutId, isWeeklyPlanMode, planSlots, sortedWorkouts]);

  const sortedExercises = useMemo(() => {
    if (!exercises.length) return [];
    return [...exercises].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [exercises]);

  const workoutItems = useMemo(
    () =>
      requiresLocalListDraft
        ? (workoutItemsDraft ?? sortedWorkouts)
        : sortedWorkouts,
    [requiresLocalListDraft, sortedWorkouts, workoutItemsDraft],
  );

  const exerciseItems = useMemo(
    () =>
      requiresLocalListDraft
        ? (exerciseItemsDraft ?? sortedExercises)
        : sortedExercises,
    [exerciseItemsDraft, requiresLocalListDraft, sortedExercises],
  );

  useEffect(() => {
    if (!requiresLocalListDraft) return;
    setWorkoutItemsDraft((current) =>
      hasSameOrderedIds(current, sortedWorkouts) ? current : sortedWorkouts,
    );
  }, [requiresLocalListDraft, sortedWorkouts]);

  useEffect(() => {
    if (!requiresLocalListDraft) return;
    setExerciseItemsDraft((current) =>
      hasSameOrderedIds(current, sortedExercises) ? current : sortedExercises,
    );
  }, [requiresLocalListDraft, sortedExercises]);

  useEffect(() => {
    if (!requiresLocalPlanSlotsDraft) return;

    if (!isOpen) {
      planSlotsDraftSourceIdRef.current = null;
      setPlanSlotsDraft(null);
      return;
    }

    const currentPlanId = weeklyPlan?.id ?? null;
    if (!currentPlanId) return;

    const isNewPlan = planSlotsDraftSourceIdRef.current !== currentPlanId;
    const hasDetailedSource = sourcePlanSlots.some((slot) => slot.workout?.id);

    if (isNewPlan || hasDetailedSource) {
      planSlotsDraftSourceIdRef.current = currentPlanId;
      setPlanSlotsDraft(sourcePlanSlots);
    }
  }, [isOpen, requiresLocalPlanSlotsDraft, sourcePlanSlots, weeklyPlan?.id]);

  const patchPlanSlotDraft = useCallback(
    (slotId: string, updater: (slot: PlanSlotData) => PlanSlotData) => {
      if (!requiresLocalPlanSlotsDraft) return;

      setPlanSlotsDraft((current) => {
        const baseSlots = current ?? sourcePlanSlots;
        return baseSlots.map((slot) =>
          slot.id === slotId ? updater(slot) : slot,
        );
      });
    },
    [requiresLocalPlanSlotsDraft, sourcePlanSlots],
  );

  const patchWorkoutInPlanDraft = useCallback(
    (
      workoutId: string,
      updater: (workout: WorkoutSession) => WorkoutSession,
    ) => {
      if (!requiresLocalPlanSlotsDraft) return;

      setPlanSlotsDraft((current) => {
        const baseSlots = current ?? sourcePlanSlots;
        return baseSlots.map((slot) =>
          slot.workout?.id === workoutId
            ? {
                ...slot,
                workout: updater(slot.workout),
              }
            : slot,
        );
      });
    },
    [requiresLocalPlanSlotsDraft, sourcePlanSlots],
  );

  const calculatedEstimatedTime = useMemo(() => {
    if (!exercises.length) return 0;

    const totalSeconds = exercises.reduce((accumulator, exercise) => {
      const sets = exercise.sets || 0;
      if (sets === 0) return accumulator;

      const repsStr = exercise.reps || "10";
      const rangeMatch = repsStr.match(/(\d+)\s*-\s*(\d+)/);
      const singleMatch = repsStr.match(/(\d+)/);
      const avgReps = rangeMatch
        ? Math.round((Number(rangeMatch[1]) + Number(rangeMatch[2])) / 2)
        : singleMatch
          ? Number(singleMatch[1])
          : 10;

      const timePerSet = avgReps * 2;
      const numberOfRests = sets > 0 ? sets - 1 : 0;

      return (
        accumulator + sets * timePerSet + numberOfRests * (exercise.rest || 60)
      );
    }, 0);

    return Math.ceil(totalSeconds / 60) + 10;
  }, [exercises]);

  const lastCalculatedTimeRef = useRef<number>(0);

  const handleUpdateWorkout = useCallback(
    async (
      workoutId: string,
      data: {
        title?: string;
        muscleGroup?: string;
        estimatedTime?: number;
        order?: number;
      },
    ) => {
      const { muscleGroup: maybeMuscleGroup, ...rest } = data;
      const payload = {
        ...rest,
        ...(maybeMuscleGroup !== undefined && {
          muscleGroup: maybeMuscleGroup as MuscleGroup,
        }),
      };

      if (isWeeklyPlanMode) {
        patchWorkoutInPlanDraft(workoutId, (workout) => ({
          ...workout,
          ...payload,
        }));
      }

      if (isGymMode) {
        if (!studentId) {
          toast.error("Aluno nao identificado");
          return;
        }

        useStudentDetailStore
          .getState()
          .updateWorkout({
            scope: "gym",
            studentId,
            workoutId,
            payload,
          })
          .then(() => onPlanUpdated?.())
          .catch((error) => {
            log.error("Edit unit modal failed to update gym workout", {
              error,
              studentId,
              workoutId,
            });
            toast.error("Erro ao atualizar treino");
          });
        return;
      }

      if (isLibraryMode) {
        if (!weeklyPlan?.id) {
          toast.error("Plano da biblioteca nao identificado");
          return;
        }

        useLibraryPlanStore
          .getState()
          .updateWorkout({
            planId: weeklyPlan.id,
            workoutId,
            payload,
          })
          .then(() => onPlanUpdated?.())
          .catch((error) => {
            log.error("Edit unit modal failed to update library workout", {
              error,
              planId: weeklyPlan.id,
              workoutId,
            });
            toast.error("Erro ao atualizar treino");
          });
        return;
      }

      actions.updateWorkout(workoutId, payload).catch((error) => {
        log.error("Edit unit modal failed to update student workout", {
          error,
          workoutId,
        });
        toast.error("Erro ao atualizar treino");
      });
    },
    [
      actions,
      isGymMode,
      isLibraryMode,
      isWeeklyPlanMode,
      onPlanUpdated,
      patchWorkoutInPlanDraft,
      studentId,
      weeklyPlan?.id,
    ],
  );

  useEffect(() => {
    if (!activeWorkout || calculatedEstimatedTime <= 0) return;

    const currentTime = activeWorkout.estimatedTime || 0;
    const hasSignificantChange =
      Math.abs(currentTime - calculatedEstimatedTime) >= 1;
    const hasChangedSinceLastUpdate =
      lastCalculatedTimeRef.current !== calculatedEstimatedTime;

    if (hasSignificantChange && hasChangedSinceLastUpdate) {
      lastCalculatedTimeRef.current = calculatedEstimatedTime;
      void handleUpdateWorkout(activeWorkout.id, {
        estimatedTime: calculatedEstimatedTime,
      });
    }
  }, [activeWorkout, calculatedEstimatedTime, handleUpdateWorkout]);

  const sourceUnitSnapshot = useMemo(() => {
    if (isOpen && isWeeklyPlanMode && weeklyPlan) {
      return {
        title: String(weeklyPlan.title ?? ""),
        description: String(weeklyPlan.description ?? ""),
      };
    }

    if (isOpen && unitId && unit) {
      return {
        title: String(unit.title ?? ""),
        description: String(unit.description ?? ""),
      };
    }

    return null;
  }, [isOpen, isWeeklyPlanMode, unit, unitId, weeklyPlan]);

  useEffect(() => {
    if (sourceUnitSnapshot) {
      const sourceId = isWeeklyPlanMode ? (weeklyPlan?.id ?? "weekly") : unitId;
      const snapshotKey = `${sourceId ?? "unknown"}::${sourceUnitSnapshot.title}::${sourceUnitSnapshot.description}`;

      if (lastHydratedUnitSnapshotRef.current !== snapshotKey) {
        setTitle(sourceUnitSnapshot.title);
        setDescription(sourceUnitSnapshot.description);
        lastHydratedUnitSnapshotRef.current = snapshotKey;
      }
      return;
    }

    lastHydratedUnitSnapshotRef.current = null;
    setEditingWorkoutId(null);
    setShowExerciseSearch(false);
    setTitle("");
    setDescription("");
    setWorkoutTitle("");
    setDeleteConfirmationId(null);
    setDeleteWorkoutConfirmationId(null);
    setChatSlotId(null);
    setPlanSlotsDraft(null);
    planSlotsDraftSourceIdRef.current = null;
    setWorkoutItemsDraft(null);
    setExerciseItemsDraft(null);
  }, [isOpen, isWeeklyPlanMode, sourceUnitSnapshot, unitId, weeklyPlan?.id]);

  useEffect(() => {
    if (activeWorkout) {
      setWorkoutTitle(activeWorkout.title ?? "");
      setWorkoutMuscleGroup(activeWorkout.muscleGroup ?? "");
      return;
    }

    setWorkoutTitle("");
    setWorkoutMuscleGroup("");
  }, [activeWorkout]);

  const handleSaveUnit = useCallback(async () => {
    setSaving(true);

    try {
      if (isWeeklyPlanMode) {
        if (isGymMode) {
          if (!studentId) {
            toast.error("Aluno nao identificado");
            return;
          }

          await useStudentDetailStore.getState().updateWeeklyPlan({
            scope: "gym",
            studentId,
            payload: { title, description },
          });
        } else if (isLibraryMode) {
          if (!weeklyPlan?.id) {
            toast.error("Plano da biblioteca nao identificado");
            return;
          }

          await useLibraryPlanStore.getState().updatePlan({
            planId: weeklyPlan.id,
            payload: { title, description },
          });
        } else {
          await actions.updateWeeklyPlan({ title, description });
        }

        onPlanUpdated?.();
        toast.success("Plano atualizado com sucesso!");
        return;
      }

      if (!unitId) return;

      await actions.updateUnit(unitId, { title, description });
      toast.success("Treino atualizado com sucesso!");
    } catch (error) {
      log.error("Edit unit modal failed to save unit", {
        error,
        unitId,
        isWeeklyPlanMode,
        apiMode,
      });
      toast.error(
        isWeeklyPlanMode
          ? "Erro ao atualizar plano"
          : "Erro ao atualizar treino",
      );
    } finally {
      setSaving(false);
    }
  }, [
    actions,
    description,
    isGymMode,
    isLibraryMode,
    isWeeklyPlanMode,
    onPlanUpdated,
    studentId,
    title,
    unitId,
    weeklyPlan?.id,
  ]);

  const handleCreateWorkout = useCallback(async () => {
    if (!unitId) return;

    try {
      if (isGymMode) {
        if (!studentId) {
          toast.error("Aluno nao identificado");
          return;
        }

        const workoutId = await useStudentDetailStore.getState().createWorkout({
          scope: "gym",
          studentId,
          payload: {
            unitId,
            title: "Novo Dia",
            description: "Descricao do treino",
            muscleGroup: "",
            difficulty: "iniciante",
            estimatedTime: 0,
            type: "strength",
          },
        });

        if (workoutId) {
          setEditingWorkoutId(workoutId);
        }
      } else {
        const workoutId = await actions.createWorkout({
          unitId,
          title: "Novo Dia",
          description: "Descricao do treino",
          muscleGroup: "",
          difficulty: "iniciante",
          estimatedTime: 0,
          type: "strength",
        });
        setEditingWorkoutId(workoutId);
      }

      toast.success("Novo dia de treino adicionado!");
    } catch (error) {
      log.error("Edit unit modal failed to create workout", {
        error,
        unitId,
        apiMode,
        studentId,
      });
      toast.error("Erro ao criar treino");
    }
  }, [actions, isGymMode, studentId, unitId]);

  const confirmDeleteWorkout = useCallback(async () => {
    if (!deleteWorkoutConfirmationId) return;

    const workoutIdToDelete = deleteWorkoutConfirmationId;
    setDeleteWorkoutConfirmationId(null);

    if (editingWorkoutId === workoutIdToDelete) {
      setEditingWorkoutId(null);
    }

    try {
      if (isGymMode) {
        if (!studentId) {
          toast.error("Aluno nao identificado");
          return;
        }

        await useStudentDetailStore.getState().deleteWorkout({
          scope: "gym",
          studentId,
          workoutId: workoutIdToDelete,
        });
      } else if (isLibraryMode) {
        if (!weeklyPlan?.id) {
          toast.error("Plano da biblioteca nao identificado");
          return;
        }

        await useLibraryPlanStore.getState().deleteWorkout({
          planId: weeklyPlan.id,
          workoutId: workoutIdToDelete,
        });
      } else {
        await actions.deleteWorkout(workoutIdToDelete);
      }

      onPlanUpdated?.();
      toast.success("Dia de treino removido!");
    } catch (error) {
      log.error("Edit unit modal failed to delete workout", {
        error,
        workoutId: workoutIdToDelete,
        apiMode,
        studentId,
        planId: weeklyPlan?.id,
      });
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Falha ao remover treino";
      toast.error(message);
    }
  }, [
    actions,
    deleteWorkoutConfirmationId,
    editingWorkoutId,
    isGymMode,
    isLibraryMode,
    onPlanUpdated,
    studentId,
    weeklyPlan?.id,
  ]);

  const cancelDeleteWorkout = useCallback(() => {
    setDeleteWorkoutConfirmationId(null);
  }, []);

  const handleResetWeek = useCallback(async () => {
    if (isGymMode) {
      toast.info("Reset semanal disponivel apenas no app do aluno.");
      return;
    }

    setResetting(true);

    try {
      await actions.resetWeeklyPlan();
      await loadWeeklyPlan?.(true);
      setWeeklyPlanSlotsKey((current) => current + 1);
      onPlanUpdated?.();
      toast.success("Semana resetada! Os treinos estao disponiveis novamente.");
    } catch {
      toast.error("Nao foi possivel resetar a semana.");
    } finally {
      setResetting(false);
    }
  }, [actions, isGymMode, loadWeeklyPlan, onPlanUpdated]);

  const handleRemoveWorkoutFromSlot = useCallback(
    async (slotId: string) => {
      const slot = planSlots.find((candidate) => candidate.id === slotId);
      if (!slot?.workout) return;

      if (isGymMode && !studentId) {
        toast.error("Aluno nao identificado");
        return;
      }

      if (isLibraryMode && !weeklyPlan?.id) {
        toast.error("Plano da biblioteca nao identificado");
        return;
      }

      setLoadingSlotId(slotId);
      const previousPlanSlots = requiresLocalPlanSlotsDraft ? planSlots : null;

      patchPlanSlotDraft(slotId, (currentSlot) => ({
        ...currentSlot,
        type: "rest",
        workout: undefined,
        completed: false,
        completedAt: undefined,
      }));

      try {
        if (isGymMode) {
          const resolvedStudentId = studentId ?? "";
          await useStudentDetailStore.getState().deleteWorkout({
            scope: "gym",
            studentId: resolvedStudentId,
            workoutId: slot.workout.id,
          });
        } else if (isLibraryMode) {
          const resolvedPlanId = weeklyPlan?.id ?? "";
          await useLibraryPlanStore.getState().deleteWorkout({
            planId: resolvedPlanId,
            workoutId: slot.workout.id,
          });
        } else {
          await actions.deleteWorkout(slot.workout.id);
          await loadWeeklyPlan?.(true);
        }

        onPlanUpdated?.();
        toast.success("Treino removido. O dia foi marcado como descanso.");
      } catch (error) {
        if (previousPlanSlots) {
          setPlanSlotsDraft(previousPlanSlots);
        }
        log.error("Edit unit modal failed to remove workout from slot", {
          error,
          slotId,
          workoutId: slot.workout.id,
          apiMode,
          studentId,
          planId: weeklyPlan?.id,
        });
        toast.error("Nao foi possivel remover o treino.");
      } finally {
        setLoadingSlotId(null);
      }
    },
    [
      actions,
      isGymMode,
      isLibraryMode,
      loadWeeklyPlan,
      onPlanUpdated,
      patchPlanSlotDraft,
      planSlots,
      requiresLocalPlanSlotsDraft,
      studentId,
      weeklyPlan?.id,
    ],
  );

  const handleAddWorkoutToSlot = useCallback(
    async (slotId: string, dayName: string) => {
      if (isGymMode && !studentId) {
        toast.error("Aluno nao identificado");
        return;
      }

      if (isLibraryMode && !weeklyPlan?.id) {
        toast.error("Plano da biblioteca nao identificado");
        return;
      }

      setLoadingSlotId(slotId);
      const previousPlanSlots = requiresLocalPlanSlotsDraft ? planSlots : null;
      const tempWorkoutId = `temp-weekly-workout-${Date.now()}`;

      patchPlanSlotDraft(slotId, (slot) => ({
        ...slot,
        type: "workout",
        workout: {
          id: tempWorkoutId,
          title: `Treino ${dayName}`,
          description: "",
          type: "strength",
          muscleGroup: "full-body" as unknown as MuscleGroup,
          difficulty: "iniciante",
          estimatedTime: 0,
          xpReward: 50,
          locked: false,
          completed: false,
          exercises: [],
        },
        completed: false,
        completedAt: undefined,
      }));

      try {
        const payload = {
          planSlotId: slotId,
          title: `Treino ${dayName}`,
          description: "",
          type: "strength",
          muscleGroup: "full-body",
          difficulty: "iniciante",
          estimatedTime: 0,
        };

        let createdWorkoutId: string | null = null;

        if (isGymMode) {
          const resolvedStudentId = studentId ?? "";
          createdWorkoutId = await useStudentDetailStore
            .getState()
            .createWorkout({
              scope: "gym",
              studentId: resolvedStudentId,
              payload,
            });
        } else if (isLibraryMode) {
          const resolvedPlanId = weeklyPlan?.id ?? "";
          createdWorkoutId = await useLibraryPlanStore
            .getState()
            .addWorkoutToSlot({
              planId: resolvedPlanId,
              payload,
            });
        } else {
          createdWorkoutId = await actions.addWeeklyPlanWorkout(payload);
          await loadWeeklyPlan?.(true);
        }

        if (createdWorkoutId) {
          patchWorkoutInPlanDraft(tempWorkoutId, (workout) => ({
            ...workout,
            id: createdWorkoutId,
          }));
        }

        onPlanUpdated?.();
        toast.success(
          "Treino adicionado. Adicione exercicios ou use o Chat IA.",
        );
      } catch (error) {
        if (previousPlanSlots) {
          setPlanSlotsDraft(previousPlanSlots);
        }
        log.error("Edit unit modal failed to add workout to slot", {
          error,
          slotId,
          dayName,
          apiMode,
          studentId,
          planId: weeklyPlan?.id,
        });
        toast.error("Nao foi possivel adicionar o treino.");
      } finally {
        setLoadingSlotId(null);
      }
    },
    [
      actions,
      isGymMode,
      isLibraryMode,
      loadWeeklyPlan,
      onPlanUpdated,
      patchPlanSlotDraft,
      patchWorkoutInPlanDraft,
      planSlots,
      requiresLocalPlanSlotsDraft,
      studentId,
      weeklyPlan?.id,
    ],
  );

  const handleReorderWorkouts = useCallback(
    (newOrder: WorkoutSession[]) => {
      if (requiresLocalListDraft) {
        setWorkoutItemsDraft(newOrder);
      }
      newOrder.forEach((workout, index) => {
        if ((workout.order ?? 0) !== index) {
          void handleUpdateWorkout(workout.id, { order: index });
        }
      });
    },
    [handleUpdateWorkout, requiresLocalListDraft],
  );

  const handleAddExercise = useCallback(() => {
    if (editingWorkoutId) {
      setShowExerciseSearch(true);
    }
  }, [editingWorkoutId]);

  const handleUpdateExercise = useCallback(
    (exerciseId: string, data: Partial<WorkoutExercise>) => {
      if (isGymMode) {
        if (!studentId) {
          toast.error("Aluno nao identificado");
          return;
        }

        useStudentDetailStore
          .getState()
          .updateWorkoutExercise({
            scope: "gym",
            studentId,
            exerciseId,
            payload: data as Record<string, unknown>,
          })
          .then(() => onPlanUpdated?.())
          .catch((error) => {
            log.error("Edit unit modal failed to update gym exercise", {
              error,
              studentId,
              exerciseId,
            });
            toast.error("Erro ao salvar exercicio");
          });
        return;
      }

      if (isLibraryMode) {
        if (!weeklyPlan?.id) {
          toast.error("Plano da biblioteca nao identificado");
          return;
        }

        useLibraryPlanStore
          .getState()
          .updateWorkoutExercise({
            planId: weeklyPlan.id,
            exerciseId,
            payload: data as Record<string, unknown>,
          })
          .then(() => onPlanUpdated?.())
          .catch((error) => {
            log.error("Edit unit modal failed to update library exercise", {
              error,
              planId: weeklyPlan.id,
              exerciseId,
            });
            toast.error("Erro ao salvar exercicio");
          });
        return;
      }

      actions.updateWorkoutExercise(exerciseId, data).catch((error) => {
        log.error("Edit unit modal failed to update student exercise", {
          error,
          exerciseId,
        });
        toast.error("Erro ao salvar exercicio");
      });
    },
    [
      actions,
      isGymMode,
      isLibraryMode,
      onPlanUpdated,
      studentId,
      weeklyPlan?.id,
    ],
  );

  const handleReorderExercises = useCallback(
    (newOrder: WorkoutExercise[]) => {
      if (requiresLocalListDraft) {
        setExerciseItemsDraft(newOrder);
      }
      newOrder.forEach((exercise, index) => {
        if ((exercise.order ?? 0) !== index) {
          handleUpdateExercise(exercise.id, { order: index });
        }
      });
    },
    [handleUpdateExercise, requiresLocalListDraft],
  );

  const handleDeleteExercise = useCallback((exerciseId: string) => {
    setDeleteConfirmationId(exerciseId);
  }, []);

  const handleDeleteWorkoutClick = useCallback((workoutId: string) => {
    setDeleteWorkoutConfirmationId(workoutId);
  }, []);

  const confirmDeleteExercise = useCallback(async () => {
    if (!deleteConfirmationId) return;

    const exerciseIdToDelete = deleteConfirmationId;
    setDeleteConfirmationId(null);

    try {
      if (isGymMode) {
        if (!studentId) {
          toast.error("Aluno nao identificado");
          return;
        }

        await useStudentDetailStore.getState().deleteWorkoutExercise({
          scope: "gym",
          studentId,
          exerciseId: exerciseIdToDelete,
        });
      } else if (isLibraryMode) {
        if (!weeklyPlan?.id) {
          toast.error("Plano da biblioteca nao identificado");
          return;
        }

        await useLibraryPlanStore.getState().deleteWorkoutExercise({
          planId: weeklyPlan.id,
          exerciseId: exerciseIdToDelete,
        });
      } else {
        await actions.deleteWorkoutExercise(exerciseIdToDelete);
      }

      onPlanUpdated?.();
      toast.success("Exercicio removido!");
    } catch (error) {
      log.error("Edit unit modal failed to delete exercise", {
        error,
        exerciseId: exerciseIdToDelete,
        apiMode,
        studentId,
        planId: weeklyPlan?.id,
      });
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Erro ao remover exercicio. Tente novamente.";
      toast.error(message);
    }
  }, [
    actions,
    deleteConfirmationId,
    isGymMode,
    isLibraryMode,
    onPlanUpdated,
    studentId,
    weeklyPlan?.id,
  ]);

  const cancelDelete = useCallback(() => {
    setDeleteConfirmationId(null);
  }, []);

  const goBackFromWorkout = useCallback(() => {
    setEditingWorkoutId(null);
    setShowExerciseSearch(false);
  }, []);

  const closeWorkoutChatWithRefresh = useCallback(() => {
    setChatSlotId(null);
    void loadWeeklyPlan?.(true);
    onPlanUpdated?.();
  }, [loadWeeklyPlan, onPlanUpdated]);

  return {
    isOpen,
    close,
    isWeeklyPlanMode,
    unitId,
    weeklyPlan,
    planSlots,
    sortedWorkouts,
    loadWeeklyPlan,
    onPlanUpdated,

    title,
    setTitle,
    description,
    setDescription,

    workoutTitle,
    setWorkoutTitle,
    workoutMuscleGroup,
    setWorkoutMuscleGroup,

    workoutItems,
    exerciseItems,

    editingWorkoutId,
    setEditingWorkoutId,
    activeWorkout,

    showExerciseSearch,
    setShowExerciseSearch,
    showWorkoutChat,
    setShowWorkoutChat,

    loadingSlotId,
    chatSlotId,
    setChatSlotId,
    resetting,
    saving,
    weeklyPlanSlotsKey,

    calculatedEstimatedTime,

    deleteConfirmationId,
    deleteWorkoutConfirmationId,

    handleSaveUnit,
    handleResetWeek,
    handleCreateWorkout,
    handleDeleteWorkoutClick,
    confirmDeleteWorkout,
    cancelDeleteWorkout,

    handleAddWorkoutToSlot,
    handleRemoveWorkoutFromSlot,
    handleReorderWorkouts,
    handleUpdateWorkout,

    handleAddExercise,
    handleUpdateExercise,
    handleReorderExercises,
    handleDeleteExercise,
    confirmDeleteExercise,
    cancelDelete,

    goBackFromWorkout,
    closeWorkoutChatWithRefresh,
  };
}
