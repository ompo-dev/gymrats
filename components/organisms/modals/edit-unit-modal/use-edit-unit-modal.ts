"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useModalStateWithParam } from "@/hooks/use-modal-state";
import { useStudent } from "@/hooks/use-student";
import { apiClient } from "@/lib/api/client";
import type {
  MuscleGroup,
  PlanSlotData,
  WeeklyPlanData,
  WorkoutExercise,
  WorkoutSession,
} from "@/lib/types";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";

export const DAY_NAMES = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

export interface UseEditUnitModalProps {
  isWeeklyPlanMode?: boolean;
  isLibraryMode?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onPlanUpdated?: () => void;
  apiMode?: "student" | "gym";
  studentId?: string;
  weeklyPlan?: WeeklyPlanData | null;
  loadWeeklyPlan?: (force?: boolean) => Promise<void>;
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
  const storeWeeklyPlan = useStudent("weeklyPlan");
  const storeLoaders = useStudent("loaders");
  const weeklyPlan = isGymMode || isLibraryMode ? weeklyPlanOverride : storeWeeklyPlan;
  const loadWeeklyPlan = isGymMode || isLibraryMode
    ? loadWeeklyPlanOverride
    : storeLoaders.loadWeeklyPlan;
  
  let weeklyPlanUrl = "/api/workouts/weekly-plan";
  if (isGymMode && studentId) {
    weeklyPlanUrl = `/api/gym/students/${studentId}/weekly-plan`;
  } else if (isLibraryMode && weeklyPlan?.id) {
    weeklyPlanUrl = `/api/workouts/library/${weeklyPlan.id}`;
  }
  const workoutsManageUrl =
    isGymMode && studentId
      ? `/api/gym/students/${studentId}/workouts/manage`
      : "/api/workouts/manage";
  const exercisesUrl =
    isGymMode && studentId
      ? `/api/gym/students/${studentId}/workouts/exercises`
      : "/api/workouts/exercises";

  const isOpen = isWeeklyPlanMode ? (isOpenProp ?? false) : isOpenEditUnit;
  const close = isWeeklyPlanMode ? (onCloseProp ?? (() => {})) : closeEditUnit;

  const planSlots = useMemo((): PlanSlotData[] => {
    if (!weeklyPlan?.slots) return [];
    return Array.isArray(weeklyPlan.slots)
      ? (weeklyPlan.slots as unknown as PlanSlotData[])
      : [];
  }, [weeklyPlan?.slots]);

  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [showWorkoutChat, setShowWorkoutChat] = useState(false);
  const [loadingSlotId, setLoadingSlotId] = useState<string | null>(null);
  const [chatSlotId, setChatSlotId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditingUnitInputs, setIsEditingUnitInputs] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [workoutMuscleGroup, setWorkoutMuscleGroup] = useState<string>("");
  const [workoutItems, setWorkoutItems] = useState<WorkoutSession[]>([]);
  const [exerciseItems, setExerciseItems] = useState<WorkoutExercise[]>([]);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<
    string | null
  >(null);
  const [deleteWorkoutConfirmationId, setDeleteWorkoutConfirmationId] =
    useState<string | null>(null);
  const [weeklyPlanSlotsKey, setWeeklyPlanSlotsKey] = useState(0);

  const unit = useStudentUnifiedStore(
    (state) => state.data.units.find((u) => u.id === unitId) || null,
  );

  const sortedWorkouts = useMemo(() => {
    if (!unit?.workouts || unit.workouts.length === 0) return [];
    return [...unit.workouts].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [unit?.workouts]);

  useEffect(() => {
    const currentIds = workoutItems.map((w) => w.id).join(",");
    const newIds = sortedWorkouts.map((w) => w.id).join(",");
    if (
      currentIds !== newIds ||
      workoutItems.length !== sortedWorkouts.length
    ) {
      setWorkoutItems(sortedWorkouts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedWorkouts, workoutItems.length, workoutItems.map]);

  const exercisesRawFromStore = useStudentUnifiedStore((state) => {
    if (!editingWorkoutId || !unitId) return null;
    const foundUnit = state.data.units.find((u) => u.id === unitId);
    if (!foundUnit) return null;
    const foundWorkout = foundUnit.workouts.find(
      (w) => w.id === editingWorkoutId,
    );
    if (!foundWorkout) return null;
    return foundWorkout.exercises || null;
  });

  const exercisesRawFromWeeklyPlan = useMemo(() => {
    if (!isWeeklyPlanMode || !weeklyPlan || !editingWorkoutId) return null;
    const slot = planSlots.find((s) => s.workout?.id === editingWorkoutId);
    return slot?.workout?.exercises ?? null;
  }, [isWeeklyPlanMode, weeklyPlan, editingWorkoutId, planSlots]);

  const exercisesRaw = isWeeklyPlanMode
    ? exercisesRawFromWeeklyPlan
    : exercisesRawFromStore;
  const exercises = useMemo(() => exercisesRaw || [], [exercisesRaw]);

  const activeWorkout = useMemo(() => {
    if (isWeeklyPlanMode && weeklyPlan && editingWorkoutId) {
      const slot = planSlots.find((s) => s.workout?.id === editingWorkoutId);
      return slot?.workout ?? null;
    }
    return sortedWorkouts.find((w) => w.id === editingWorkoutId) ?? null;
  }, [
    isWeeklyPlanMode,
    weeklyPlan,
    planSlots,
    sortedWorkouts,
    editingWorkoutId,
  ]);

  const sortedExercises = useMemo(() => {
    if (!exercises || exercises.length === 0) return [];
    return [...exercises].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [exercises]);

  useEffect(() => {
    const currentIds = exerciseItems.map((e) => e.id).join(",");
    const newIds = sortedExercises.map((e) => e.id).join(",");
    if (
      currentIds !== newIds ||
      exerciseItems.length !== sortedExercises.length
    ) {
      setExerciseItems(sortedExercises);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedExercises, exerciseItems.length, exerciseItems.map]);

  const calculatedEstimatedTime = useMemo(() => {
    if (!exercises || exercises.length === 0) return 0;
    const TIME_PER_REP = 2;
    const totalSeconds = exercises.reduce(
      (total: number, ex: WorkoutExercise) => {
        const sets = ex.sets || 0;
        if (sets === 0) return total;
        const repsStr = ex.reps || "10";
        let avgReps = 10;
        const rangeMatch = repsStr.match(/(\d+)\s*-\s*(\d+)/);
        if (rangeMatch) {
          const min = parseInt(rangeMatch[1], 10);
          const max = parseInt(rangeMatch[2], 10);
          avgReps = Math.round((min + max) / 2);
        } else {
          const singleMatch = repsStr.match(/(\d+)/);
          if (singleMatch) avgReps = parseInt(singleMatch[1], 10);
        }
        const timePerSet = avgReps * TIME_PER_REP;
        const restBetweenSets = ex.rest || 60;
        const numberOfRests = sets > 0 ? sets - 1 : 0;
        return total + sets * timePerSet + numberOfRests * restBetweenSets;
      },
      0,
    );
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
      const { muscleGroup: mg, ...rest } = data;
      const payload = {
        ...rest,
        ...(mg !== undefined && { muscleGroup: mg as MuscleGroup }),
      };
      if (isGymMode) {
        if (!studentId) {
          toast.error("Aluno não identificado");
          return;
        }
        apiClient
          .put(`${workoutsManageUrl}/${workoutId}`, payload)
          .then(() => loadWeeklyPlan?.(true))
          .then(() => onPlanUpdated?.())
          .catch((err) => {
            console.error(err);
            toast.error("Erro ao atualizar treino");
          });
      } else {
        actions.updateWorkout(workoutId, payload).catch((err) => {
          console.error(err);
          toast.error("Erro ao atualizar treino");
        });
      }
    },
    [
      actions,
      isGymMode,
      studentId,
      workoutsManageUrl,
      loadWeeklyPlan,
      onPlanUpdated,
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
      handleUpdateWorkout(activeWorkout.id, {
        estimatedTime: calculatedEstimatedTime,
      });
    }
  }, [calculatedEstimatedTime, activeWorkout, handleUpdateWorkout]);

  useEffect(() => {
    if (isOpen && isWeeklyPlanMode && weeklyPlan) {
      if (!isEditingUnitInputs && title === "" && description === "") {
        setTitle(String(weeklyPlan.title ?? ""));
        setDescription(String(weeklyPlan.description ?? ""));
      }
    } else if (isOpen && unitId && unit) {
      if (!isEditingUnitInputs && title === "" && description === "") {
        setTitle(String(unit.title ?? ""));
        setDescription(String(unit.description ?? ""));
      }
    } else {
      setEditingWorkoutId(null);
      setShowExerciseSearch(false);
      setTitle("");
      setDescription("");
      setWorkoutTitle("");
      setDeleteConfirmationId(null);
      setDeleteWorkoutConfirmationId(null);
      setChatSlotId(null);
      setWorkoutItems([]);
      setExerciseItems([]);
    }
  }, [
    isOpen,
    unitId,
    unit?.id,
    isWeeklyPlanMode,
    weeklyPlan,
    isEditingUnitInputs,
    title,
    unit,
    description,
  ]);

  useEffect(() => {
    if (activeWorkout) {
      setWorkoutTitle(activeWorkout.title ?? "");
      setWorkoutMuscleGroup(activeWorkout.muscleGroup ?? "");
    } else {
      setWorkoutTitle("");
      setWorkoutMuscleGroup("");
    }
  }, [
    activeWorkout?.id,
    activeWorkout?.title,
    activeWorkout?.muscleGroup,
    activeWorkout,
  ]);

  const handleSaveUnit = useCallback(async () => {
    if (isWeeklyPlanMode) {
      try {
        await apiClient.patch(weeklyPlanUrl, {
          title,
          description,
        });
        await loadWeeklyPlan?.(true);
        onPlanUpdated?.();
        toast.success("Plano atualizado com sucesso!");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao atualizar plano");
      }
      return;
    }
    if (!unitId) return;
    try {
      await actions.updateUnit(unitId, { title, description });
      toast.success("Treino atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar treino");
    }
  }, [
    isWeeklyPlanMode,
    title,
    description,
    unitId,
    actions,
    loadWeeklyPlan,
    onPlanUpdated,
  ]);

  const handleSaveAsTemplate = useCallback(async () => {
    if (!isWeeklyPlanMode || !weeklyPlan) return;
    setSavingTemplate(true);
    try {
      await actions.createLibraryPlan({
        title: title || weeklyPlan.title || "Novo Modelo",
        description: description || weeklyPlan.description || "",
        difficulty: "iniciante", // Default values since WeeklyPlanData doesn't have them
        goals: [],
        sourceWeeklyPlanId: weeklyPlan.id,
      });
      toast.success("Plano salvo na biblioteca de treinos!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar como modelo na biblioteca");
    } finally {
      setSavingTemplate(false);
    }
  }, [
    isWeeklyPlanMode,
    weeklyPlan,
    title,
    description,
    actions,
  ]);

  const handleCreateWorkout = useCallback(async () => {
    if (!unitId) return;
    try {
      if (isGymMode) {
        if (!studentId) {
          toast.error("Aluno não identificado");
          return;
        }
        const response = await apiClient.post(workoutsManageUrl, {
          unitId,
          title: "Novo Dia",
          description: "Descrição do treino",
          muscleGroup: "",
          difficulty: "iniciante",
          estimatedTime: 0,
          type: "strength",
        });
        const workoutId = (response as any).data?.data?.id as string | undefined;
        if (workoutId) {
          setEditingWorkoutId(workoutId);
        }
      } else {
        const workoutId = await actions.createWorkout({
          unitId,
          title: "Novo Dia",
          description: "Descrição do treino",
          muscleGroup: "",
          difficulty: "iniciante",
          estimatedTime: 0,
          type: "strength",
        });
        setEditingWorkoutId(workoutId);
      }
      toast.success("Novo dia de treino adicionado!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar treino");
    }
  }, [unitId, actions, isGymMode, studentId, workoutsManageUrl]);

  const confirmDeleteWorkout = useCallback(async () => {
    if (!deleteWorkoutConfirmationId) return;
    const workoutIdToDelete = deleteWorkoutConfirmationId;
    setDeleteWorkoutConfirmationId(null);
    if (editingWorkoutId === workoutIdToDelete) setEditingWorkoutId(null);
    try {
      if (isGymMode) {
        if (!studentId) {
          toast.error("Aluno não identificado");
          return;
        }
        await apiClient.delete(`${workoutsManageUrl}/${workoutIdToDelete}`);
        await loadWeeklyPlan?.(true);
        onPlanUpdated?.();
      } else {
        await actions.deleteWorkout(workoutIdToDelete);
      }
      toast.success("Dia de treino removido!");
    } catch (err) {
      console.error(err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Falha ao remover treino";
      toast.error(message);
    }
  }, [
    deleteWorkoutConfirmationId,
    editingWorkoutId,
    actions,
    isGymMode,
    studentId,
    workoutsManageUrl,
    loadWeeklyPlan,
    onPlanUpdated,
  ]);

  const cancelDeleteWorkout = useCallback(
    () => setDeleteWorkoutConfirmationId(null),
    [],
  );

  const handleResetWeek = useCallback(async () => {
    if (isGymMode) {
      toast.info("Reset semanal disponível apenas no app do aluno.");
      return;
    }
    setResetting(true);
    try {
      await apiClient.patch("/api/students/week-reset");
      await loadWeeklyPlan?.(true);
      setWeeklyPlanSlotsKey((k) => k + 1);
      onPlanUpdated?.();
      toast.success("Semana resetada! Os treinos estão disponíveis novamente.");
    } catch {
      toast.error("Não foi possível resetar a semana.");
    } finally {
      setResetting(false);
    }
  }, [loadWeeklyPlan, onPlanUpdated, isGymMode]);

  const handleRemoveWorkoutFromSlot = useCallback(
    async (slotId: string) => {
      const slot = planSlots.find((s) => s.id === slotId);
      if (!slot?.workout) return;
      setLoadingSlotId(slotId);
      try {
        await apiClient.delete(`${workoutsManageUrl}/${slot.workout.id}`);
        await loadWeeklyPlan?.(true);
        onPlanUpdated?.();
        toast.success("Treino removido. O dia foi marcado como descanso.");
      } catch {
        toast.error("Não foi possível remover o treino.");
      } finally {
        setLoadingSlotId(null);
      }
    },
    [planSlots, loadWeeklyPlan, onPlanUpdated, workoutsManageUrl],
  );

  const handleAddWorkoutToSlot = useCallback(
    async (slotId: string, dayName: string) => {
      setLoadingSlotId(slotId);
      try {
        await apiClient.post(workoutsManageUrl, {
          planSlotId: slotId,
          title: `Treino ${dayName}`,
          description: "",
          type: "strength",
          muscleGroup: "full-body",
          difficulty: "iniciante",
          estimatedTime: 0,
        });
        await loadWeeklyPlan?.(true);
        onPlanUpdated?.();
        toast.success(
          "Treino adicionado. Adicione exercícios ou use o Chat IA.",
        );
      } catch {
        toast.error("Não foi possível adicionar o treino.");
      } finally {
        setLoadingSlotId(null);
      }
    },
    [loadWeeklyPlan, onPlanUpdated],
  );

  const handleReorderWorkouts = useCallback(
    (newOrder: WorkoutSession[]) => {
      setWorkoutItems(newOrder);
      newOrder.forEach((workout, index) => {
        if ((workout.order ?? 0) !== index) {
          handleUpdateWorkout(workout.id, { order: index });
        }
      });
    },
    [handleUpdateWorkout],
  );

  const handleAddExercise = useCallback(() => {
    if (editingWorkoutId) setShowExerciseSearch(true);
  }, [editingWorkoutId]);

  const handleUpdateExercise = useCallback(
    (exerciseId: string, data: Partial<WorkoutExercise>) => {
      if (isGymMode) {
        if (!studentId) {
          toast.error("Aluno não identificado");
          return;
        }
        apiClient
          .put(`${exercisesUrl}/${exerciseId}`, data as any)
          .then(() => loadWeeklyPlan?.(true))
          .then(() => onPlanUpdated?.())
          .catch((err) => {
            console.error(err);
            toast.error("Erro ao salvar exercício");
          });
        return;
      }
      actions.updateWorkoutExercise(exerciseId, data).catch((err) => {
        console.error(err);
        toast.error("Erro ao salvar exercício");
      });
    },
    [
      actions,
      isGymMode,
      studentId,
      exercisesUrl,
      loadWeeklyPlan,
      onPlanUpdated,
    ],
  );

  const handleReorderExercises = useCallback(
    (newOrder: WorkoutExercise[]) => {
      setExerciseItems(newOrder);
      newOrder.forEach((exercise, index) => {
        if ((exercise.order ?? 0) !== index) {
          handleUpdateExercise(exercise.id, { order: index });
        }
      });
    },
    [handleUpdateExercise],
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
          toast.error("Aluno não identificado");
          return;
        }
        await apiClient.delete(`${exercisesUrl}/${exerciseIdToDelete}`);
        await loadWeeklyPlan?.(true);
        onPlanUpdated?.();
      } else {
        await actions.deleteWorkoutExercise(exerciseIdToDelete);
      }
      toast.success("Exercício removido!");
    } catch (err) {
      console.error(err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Erro ao remover exercício. Tente novamente.";
      toast.error(message);
    }
  }, [
    deleteConfirmationId,
    actions,
    isGymMode,
    studentId,
    exercisesUrl,
    loadWeeklyPlan,
    onPlanUpdated,
  ]);

  const cancelDelete = useCallback(() => setDeleteConfirmationId(null), []);

  const goBackFromWorkout = useCallback(() => {
    setEditingWorkoutId(null);
    setShowExerciseSearch(false);
  }, []);

  const closeWorkoutChatWithRefresh = useCallback(() => {
    setChatSlotId(null);
    loadWeeklyPlan?.(true);
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
    isEditingUnitInputs,
    setIsEditingUnitInputs,

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
    savingTemplate,
    weeklyPlanSlotsKey,

    calculatedEstimatedTime,

    deleteConfirmationId,
    deleteWorkoutConfirmationId,

    handleSaveUnit,
    handleSaveAsTemplate,
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
