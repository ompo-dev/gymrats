"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useModalStateWithParam } from "@/hooks/use-modal-state";
import { useStudent } from "@/hooks/use-student";
import { apiClient } from "@/lib/api/client";
import type {
  MuscleGroup,
  PlanSlotData,
  WorkoutExercise,
  WorkoutSession,
} from "@/lib/types";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import {
  UnitDetailsForm,
  WorkoutsListSection,
  WorkoutDetailView,
} from "./edit-unit-modal/index";
import { ExerciseSearch } from "./exercise-search";
import { Modal } from "./modal";
import { WorkoutChat } from "./workout-chat";

const DAY_NAMES = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

interface EditUnitModalProps {
  isWeeklyPlanMode?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onPlanUpdated?: () => void;
}

export function EditUnitModal({
  isWeeklyPlanMode = false,
  isOpen: isOpenProp,
  onClose: onCloseProp,
  onPlanUpdated,
}: EditUnitModalProps = {}) {
  const _router = useRouter();
  const {
    isOpen: isOpenEditUnit,
    close: closeEditUnit,
    paramValue: unitId,
  } = useModalStateWithParam("editUnit", "unitId");
  const actions = useStudent("actions");
  const weeklyPlan = useStudent("weeklyPlan");
  const { loadWeeklyPlan } = useStudent("loaders");

  const isOpen = isWeeklyPlanMode ? (isOpenProp ?? false) : isOpenEditUnit;
  const close = isWeeklyPlanMode ? (onCloseProp ?? (() => {})) : closeEditUnit;

  // Slots do plano semanal de forma type-safe (API/store podem devolver JsonValue)
  const planSlots = useMemo((): PlanSlotData[] => {
    if (!weeklyPlan?.slots) return [];
    return Array.isArray(weeklyPlan.slots)
      ? (weeklyPlan.slots as unknown as PlanSlotData[])
      : [];
  }, [weeklyPlan?.slots]);

  const [showExerciseSearch, setShowExerciseSearch] = useState(false);

  // View state
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [showWorkoutChat, setShowWorkoutChat] = useState(false);

  // Weekly plan mode state
  const [loadingSlotId, setLoadingSlotId] = useState<string | null>(null);
  const [chatSlotId, setChatSlotId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // Form states (Unit) - apenas para inputs controlados
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditingUnitInputs, setIsEditingUnitInputs] = useState(false);

  // Estado controlado para título do workout
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [workoutMuscleGroup, setWorkoutMuscleGroup] = useState<string>("");

  // Estados para reordenação usando Reorder
  const [workoutItems, setWorkoutItems] = useState<WorkoutSession[]>([]);
  const [exerciseItems, setExerciseItems] = useState<WorkoutExercise[]>([]);

  // IMPORTANTE: Seletores específicos do Zustand que detectam mudanças IMEDIATAMENTE
  // Quando addWorkoutExercise faz optimistic update no store, estes seletores detectam INSTANTANEAMENTE
  // porque o Zustand re-renderiza quando state.data.units muda (nova referência de array)

  // Seletor para unit completo - retorna null se não encontrado
  const unit = useStudentUnifiedStore((state) => {
    return state.data.units.find((u) => u.id === unitId) || null;
  });

  // Ordenar workouts por ordem antes de usar
  // IMPORTANTE: Usar IDs para comparação estável e evitar loops infinitos
  const _workoutsIds = useMemo(() => {
    if (!unit?.workouts || unit.workouts.length === 0) return "";
    return unit.workouts.map((w) => w.id).join(",");
  }, [unit?.workouts]);

  const sortedWorkouts = useMemo(() => {
    if (!unit?.workouts || unit.workouts.length === 0) return [];
    // Criar novo array para garantir reatividade do useMemo
    return [...unit.workouts].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [unit?.workouts]);

  // Sincronizar workoutItems com sortedWorkouts
  // IMPORTANTE: Verificar se realmente mudou para evitar loops infinitos
  // CRÍTICO: Não incluir workoutItems nas dependências para evitar loops
  useEffect(() => {
    // Verificar se realmente mudou (comparando IDs e tamanho para evitar loops)
    const currentIds = workoutItems.map((w) => w.id).join(",");
    const newIds = sortedWorkouts.map((w) => w.id).join(",");

    // Só atualizar se IDs mudaram OU se o tamanho mudou (novo workout adicionado)
    if (
      currentIds !== newIds ||
      workoutItems.length !== sortedWorkouts.length
    ) {
      setWorkoutItems(sortedWorkouts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedWorkouts, workoutItems.length, workoutItems.map]); // IMPORTANTE: Não incluir workoutItems para evitar loops

  // IMPORTANTE: Seletor específico para exercises do workout ativo
  // Quando isWeeklyPlanMode: vem de weeklyPlan.slots. Caso contrário: do store (units)
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
    const slot = planSlots.find(
      (s: PlanSlotData) => s.workout?.id === editingWorkoutId,
    );
    return slot?.workout?.exercises ?? null;
  }, [isWeeklyPlanMode, weeklyPlan, editingWorkoutId, planSlots]);

  const exercisesRaw = isWeeklyPlanMode
    ? exercisesRawFromWeeklyPlan
    : exercisesRawFromStore;

  // Usar useMemo para garantir referência estável quando exercises não existe
  // Isso evita loops infinitos causados por novas referências a cada render
  const exercises = useMemo(() => {
    return exercisesRaw || [];
  }, [exercisesRaw]);

  // Calcular activeWorkout - de weeklyPlan quando isWeeklyPlanMode, senão de sortedWorkouts
  const activeWorkout = useMemo(() => {
    if (isWeeklyPlanMode && weeklyPlan && editingWorkoutId) {
      const slot = planSlots.find(
        (s: PlanSlotData) => s.workout?.id === editingWorkoutId,
      );
      return slot?.workout ?? null;
    }
    return (
      sortedWorkouts.find((w: WorkoutSession) => w.id === editingWorkoutId) ??
      null
    );
  }, [isWeeklyPlanMode, weeklyPlan, planSlots, sortedWorkouts, editingWorkoutId]);

  // Ordenar exercícios por ordem - IMPORTANTE: usar exercises do store diretamente!
  // CRÍTICO: Usar IDs para comparação estável e evitar loops infinitos
  // Quando addWorkoutExercise faz optimistic update:
  // 1. Store atualiza state.data.units com NOVO array (nova referência)
  // 2. Seletor `exercises` detecta mudança e retorna NOVO array de exercises
  // 3. useMemo detecta mudança em `exercisesIds` e recalcula sortedExercises
  // 4. useEffect detecta mudança em sortedExercises e atualiza exerciseItems
  // 5. Componente re-renderiza IMEDIATAMENTE com novos exercícios!
  const _exercisesIds = useMemo(() => {
    if (!exercises || exercises.length === 0) return "";
    return exercises.map((ex: WorkoutExercise) => ex.id).join(",");
  }, [exercises]);

  const sortedExercises = useMemo(() => {
    if (!exercises || exercises.length === 0) return [];
    // Criar novo array para garantir reatividade do useMemo
    return [...exercises].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [exercises]);

  // Sincronizar exerciseItems com sortedExercises - IMPORTANTE: verificar mudanças reais!
  // Isso garante que optimistic updates apareçam instantaneamente na UI
  // O Reorder precisa de estado controlado, mas deve sempre refletir sortedExercises
  // CRÍTICO: Verificar se realmente mudou (comparando IDs) para evitar loops infinitos
  // IMPORTANTE: Não incluir exerciseItems nas dependências para evitar loops
  useEffect(() => {
    // Verificar se realmente mudou (comparando IDs e tamanho para evitar loops)
    const currentIds = exerciseItems.map((e) => e.id).join(",");
    const newIds = sortedExercises.map((e) => e.id).join(",");

    // Só atualizar se IDs mudaram OU se o tamanho mudou (novo exercício adicionado)
    if (
      currentIds !== newIds ||
      exerciseItems.length !== sortedExercises.length
    ) {
      setExerciseItems(sortedExercises);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedExercises, exerciseItems.length, exerciseItems.map]); // IMPORTANTE: Não incluir exerciseItems para evitar loops

  // Calcular tempo estimado baseado nos exercícios
  // IMPORTANTE: Usar exercises diretamente do store para garantir reatividade imediata
  // Quando addWorkoutExercise faz optimistic update, exercises muda IMEDIATAMENTE
  const calculatedEstimatedTime = useMemo(() => {
    if (!exercises || exercises.length === 0) {
      return 0;
    }

    const TIME_PER_REP = 2; // segundos por repetição (média)

    const totalSeconds = exercises.reduce(
      (total: number, ex: WorkoutExercise) => {
        const sets = ex.sets || 0;
        if (sets === 0) return total;

        // Parse reps (pode ser "8-12" ou "12")
        const repsStr = ex.reps || "10";
        let avgReps = 10; // padrão

        // Verificar se é um range (ex: "8-12")
        const rangeMatch = repsStr.match(/(\d+)\s*-\s*(\d+)/);
        if (rangeMatch) {
          // Se for range, usar a média dos dois valores
          const min = parseInt(rangeMatch[1], 10);
          const max = parseInt(rangeMatch[2], 10);
          avgReps = Math.round((min + max) / 2);
        } else {
          // Se for um número único, usar esse valor
          const singleMatch = repsStr.match(/(\d+)/);
          if (singleMatch) {
            avgReps = parseInt(singleMatch[1], 10);
          }
        }

        // Tempo por série = média de repetições * tempo por repetição
        const timePerSet = avgReps * TIME_PER_REP;

        // Descanso entre séries (se são 4 séries, há 3 descansos)
        const restBetweenSets = ex.rest || 60; // segundos
        const numberOfRests = sets > 0 ? sets - 1 : 0;

        // Tempo total do exercício = (séries * tempo_por_serie) + (número_de_descansos * descanso)
        const exerciseTime =
          sets * timePerSet + numberOfRests * restBetweenSets;

        return total + exerciseTime;
      },
      0,
    );

    // Converter para minutos e arredondar para cima
    const totalMinutes = Math.ceil(totalSeconds / 60);

    // Adicionar 10 minutos para atividades preparatórias
    // (pegar anilhas, trocar pesos, séries preparatórias, aquecimento, válidas, até a falha, etc.)
    return totalMinutes + 10;
  }, [exercises]); // IMPORTANTE: Usar exercises diretamente do store para garantir reatividade imediata

  // Atualizar estimatedTime quando exercícios mudarem
  // IMPORTANTE: Usar ref para evitar loops infinitos - só atualizar uma vez por mudança real
  const lastCalculatedTimeRef = useRef<number>(0);

  // Função para atualizar workout - DEVE estar ANTES do useEffect que a usa
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
      // Não precisa de try/catch com toast - optimistic update já atualiza UI instantaneamente!
      // Store espera muscleGroup como MuscleGroup
      const { muscleGroup: mg, ...rest } = data;
      const payload = {
        ...rest,
        ...(mg !== undefined && { muscleGroup: mg as MuscleGroup }),
      };
      actions.updateWorkout(workoutId, payload).catch((error) => {
        console.error(error);
        toast.error("Erro ao atualizar treino");
      });
    },
    [actions],
  );

  useEffect(() => {
    if (!activeWorkout || calculatedEstimatedTime <= 0) return;

    // Só atualiza se o valor realmente mudou (com margem de 1 minuto)
    const currentTime = activeWorkout.estimatedTime || 0;
    const hasSignificantChange =
      Math.abs(currentTime - calculatedEstimatedTime) >= 1;
    const hasChangedSinceLastUpdate =
      lastCalculatedTimeRef.current !== calculatedEstimatedTime;

    // CRÍTICO: Só atualizar se realmente mudou E não atualizamos este valor ainda
    if (hasSignificantChange && hasChangedSinceLastUpdate) {
      lastCalculatedTimeRef.current = calculatedEstimatedTime;
      handleUpdateWorkout(activeWorkout.id, {
        estimatedTime: calculatedEstimatedTime,
      });
    }
  }, [calculatedEstimatedTime, activeWorkout, handleUpdateWorkout]);

  // Sincronizar inputs - de unit ou weeklyPlan (garantir string para setState)
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
      // Reset state when closed
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

  // Sincronizar workoutTitle e muscleGroup quando activeWorkout mudar
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

  // --- Unit Actions ---

  const handleSaveUnit = async () => {
    if (isWeeklyPlanMode) {
      try {
        await apiClient.patch("/api/workouts/weekly-plan", {
          title,
          description,
        });
        await loadWeeklyPlan(true);
        onPlanUpdated?.();
        toast.success("Plano atualizado com sucesso!");
      } catch (error) {
        console.error(error);
        toast.error("Erro ao atualizar plano");
      }
      return;
    }
    if (!unitId) return;
    try {
      await actions.updateUnit(unitId, { title, description });
      toast.success("Treino atualizado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar treino");
    }
  };

  const handleCreateWorkout = async () => {
    if (!unitId) return;

    // Não precisa de setIsSaving - optimistic update já atualiza UI instantaneamente!
    try {
      // createWorkout retorna o ID do workout criado (temporário ou real)
      const workoutId = await actions.createWorkout({
        unitId,
        title: "Novo Dia",
        description: "Descrição do treino",
        muscleGroup: "", // Vazio - será selecionado no modal depois
        difficulty: "iniciante",
        estimatedTime: 0, // Será calculado automaticamente baseado nos exercícios
        type: "strength",
      });

      // Abrir modal de edição imediatamente com o ID retornado
      // O ID pode ser temporário (se offline) ou real (se sincronizado)
      // O componente vai reagir automaticamente quando o ID for atualizado
      setEditingWorkoutId(workoutId);

      // Toast apenas para feedback - UI já atualizou via optimistic update
      toast.success("Novo dia de treino adicionado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar treino");
    }
  };

  const _handleDeleteWorkout = async (workoutId: string) => {
    setDeleteWorkoutConfirmationId(workoutId);
  };

  const confirmDeleteWorkout = async () => {
    if (!deleteWorkoutConfirmationId) return;

    const workoutIdToDelete = deleteWorkoutConfirmationId;
    setDeleteWorkoutConfirmationId(null);

    // Se estava editando esse workout, voltar para a view de unit ANTES de deletar
    if (editingWorkoutId === workoutIdToDelete) {
      setEditingWorkoutId(null);
    }

    // Não precisa de setIsSaving - optimistic update já atualiza UI instantaneamente!
    try {
      await actions.deleteWorkout(workoutIdToDelete);
      // Toast apenas para feedback - UI já atualizou via optimistic update
      toast.success("Dia de treino removido!");
    } catch (error) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || "Falha ao remover treino";
      toast.error(message);
    }
  };

  const cancelDeleteWorkout = () => {
    setDeleteWorkoutConfirmationId(null);
  };

  // --- Weekly Plan Actions ---
  const handleResetWeek = async () => {
    setResetting(true);
    try {
      await apiClient.patch("/api/students/week-reset");
      await loadWeeklyPlan(true);
      onPlanUpdated?.();
      toast.success("Semana resetada! Os treinos estão disponíveis novamente.");
    } catch {
      toast.error("Não foi possível resetar a semana.");
    } finally {
      setResetting(false);
    }
  };

  const handleRemoveWorkoutFromSlot = async (slotId: string) => {
    const slot = planSlots.find((s: PlanSlotData) => s.id === slotId);
    if (!slot?.workout) return;
    setLoadingSlotId(slotId);
    try {
      await apiClient.delete(`/api/workouts/manage/${slot.workout.id}`);
      await loadWeeklyPlan(true);
      onPlanUpdated?.();
      toast.success("Treino removido. O dia foi marcado como descanso.");
    } catch {
      toast.error("Não foi possível remover o treino.");
    } finally {
      setLoadingSlotId(null);
    }
  };

  const handleAddWorkoutToSlot = async (slotId: string, dayName: string) => {
    setLoadingSlotId(slotId);
    try {
      await apiClient.post("/api/workouts/manage", {
        planSlotId: slotId,
        title: `Treino ${dayName}`,
        description: "",
        type: "strength",
        muscleGroup: "full-body",
        difficulty: "iniciante",
        estimatedTime: 0,
      });
      await loadWeeklyPlan(true);
      onPlanUpdated?.();
      toast.success("Treino adicionado. Adicione exercícios ou use o Chat IA.");
    } catch {
      toast.error("Não foi possível adicionar o treino.");
    } finally {
      setLoadingSlotId(null);
    }
  };

  // Reordenar workouts usando Reorder
  const handleReorderWorkouts = (newOrder: WorkoutSession[]) => {
    setWorkoutItems(newOrder);
    // Atualizar ordem de todos os workouts no backend
    newOrder.forEach((workout, index) => {
      const currentOrder = workout.order ?? 0;
      if (currentOrder !== index) {
        handleUpdateWorkout(workout.id, { order: index });
      }
    });
  };

  // --- Exercise Actions ---

  const handleAddExercise = async () => {
    if (!editingWorkoutId) return;
    setShowExerciseSearch(true);
  };

  const handleUpdateExercise = async (
    exerciseId: string,
    data: Partial<WorkoutExercise>,
  ) => {
    // Não precisa de try/catch com toast - optimistic update já atualiza UI instantaneamente!
    // Apenas chamar a action - o store gerencia tudo
    actions.updateWorkoutExercise(exerciseId, data).catch((error) => {
      console.error(error);
      toast.error("Erro ao salvar exercício");
    });
  };

  // Reordenar exercícios usando Reorder
  const handleReorderExercises = (newOrder: WorkoutExercise[]) => {
    setExerciseItems(newOrder);
    // Atualizar ordem de todos os exercícios no backend
    newOrder.forEach((exercise, index) => {
      const currentOrder = exercise.order ?? 0;
      if (currentOrder !== index) {
        handleUpdateExercise(exercise.id, { order: index });
      }
    });
  };

  const [deleteConfirmationId, setDeleteConfirmationId] = useState<
    string | null
  >(null);
  const [deleteWorkoutConfirmationId, setDeleteWorkoutConfirmationId] =
    useState<string | null>(null);

  const handleDeleteExercise = async (exerciseId: string) => {
    setDeleteConfirmationId(exerciseId);
  };

  const handleDeleteWorkoutClick = (workoutId: string) => {
    setDeleteWorkoutConfirmationId(workoutId);
  };

  const confirmDeleteExercise = async () => {
    if (!deleteConfirmationId) return;

    const exerciseIdToDelete = deleteConfirmationId;
    setDeleteConfirmationId(null);

    // Não precisa de setIsSaving - optimistic update já atualiza UI instantaneamente!
    try {
      await actions.deleteWorkoutExercise(exerciseIdToDelete);
      // Toast apenas para feedback - UI já atualizou via optimistic update
      toast.success("Exercício removido!");
    } catch (error) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err?.response?.data?.message ||
        "Erro ao remover exercício. Tente novamente.";
      toast.error(errorMessage);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmationId(null);
  };

  if (!isOpen) return null;
  if (isWeeklyPlanMode && !weeklyPlan) return null;

  return (
    <>
      <Modal.Root isOpen={isOpen} onClose={close}>
        <Modal.Header
          title={
            editingWorkoutId
              ? `Editar ${activeWorkout?.title}`
              : "Editar Planejamento"
          }
          onClose={close}
          onBack={
            editingWorkoutId
              ? () => {
                  setEditingWorkoutId(null);
                  setShowExerciseSearch(false);
                }
              : undefined
          }
        />

        <Modal.Content maxHeight="none">
          {!editingWorkoutId ? (
            <div className="space-y-8" style={{ minHeight: "400px" }}>
              <UnitDetailsForm
                title={title}
                description={description}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onTitleFocus={() => setIsEditingUnitInputs(true)}
                onTitleBlur={() => setIsEditingUnitInputs(false)}
                onDescriptionFocus={() => setIsEditingUnitInputs(true)}
                onDescriptionBlur={() => setIsEditingUnitInputs(false)}
                onSave={handleSaveUnit}
                isWeeklyPlanMode={isWeeklyPlanMode}
                onResetWeek={handleResetWeek}
                resetting={resetting}
              />
              <WorkoutsListSection
                isWeeklyPlanMode={isWeeklyPlanMode}
                weeklyPlan={weeklyPlan ? { id: String(weeklyPlan.id) } : null}
                planSlots={planSlots}
                workoutItems={workoutItems}
                loadingSlotId={loadingSlotId}
                onChatClick={setChatSlotId}
                onAddWorkoutToSlot={handleAddWorkoutToSlot}
                onRemoveWorkoutFromSlot={handleRemoveWorkoutFromSlot}
                onEditWorkout={setEditingWorkoutId}
                onReorderWorkouts={handleReorderWorkouts}
                onCreateWorkout={handleCreateWorkout}
                onDeleteWorkoutClick={handleDeleteWorkoutClick}
                onOpenWorkoutChat={() => setShowWorkoutChat(true)}
              />
            </div>
          ) : (
            <WorkoutDetailView
              workoutTitle={workoutTitle}
              workoutMuscleGroup={workoutMuscleGroup}
              onWorkoutTitleChange={setWorkoutTitle}
              onWorkoutTitleBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                if (
                  activeWorkout &&
                  e.target.value !== activeWorkout.title &&
                  e.target.value.trim() !== ""
                ) {
                  handleUpdateWorkout(activeWorkout.id, {
                    title: e.target.value,
                  });
                } else if (e.target.value.trim() === "") {
                  setWorkoutTitle(activeWorkout?.title ?? "");
                }
              }}
              onMuscleGroupChange={(value: string) => {
                setWorkoutMuscleGroup(value);
                if (activeWorkout) {
                  handleUpdateWorkout(activeWorkout.id, {
                    muscleGroup: value,
                  });
                }
              }}
              activeWorkoutId={editingWorkoutId}
              calculatedEstimatedTime={calculatedEstimatedTime}
              exerciseItems={exerciseItems}
              onReorderExercises={handleReorderExercises}
              onUpdateExercise={handleUpdateExercise}
              onAddExercise={handleAddExercise}
              onDeleteExercise={handleDeleteExercise}
              isWeeklyPlanMode={isWeeklyPlanMode}
              weeklyPlan={weeklyPlan ? { id: String(weeklyPlan.id) } : null}
              planSlots={planSlots}
              onOpenSlotChat={setChatSlotId}
              onOpenWorkoutChat={() => setShowWorkoutChat(true)}
            />
          )}
        </Modal.Content>
      </Modal.Root>

      {showExerciseSearch && editingWorkoutId && isOpen && (
        <ExerciseSearch.Simple
          workoutId={editingWorkoutId}
          onClose={() => setShowExerciseSearch(false)}
        />
      )}

      {showWorkoutChat && isOpen && unitId && (
        <WorkoutChat
          unitId={unitId}
          workouts={sortedWorkouts}
          onClose={() => setShowWorkoutChat(false)}
        />
      )}

      {chatSlotId && isWeeklyPlanMode && weeklyPlan && (
        <WorkoutChat
          planSlotId={chatSlotId}
          slotContext={
            DAY_NAMES[
              planSlots.find((s: PlanSlotData) => s.id === chatSlotId)
                ?.dayOfWeek ?? 0
            ]
          }
          onClose={() => {
            setChatSlotId(null);
            loadWeeklyPlan(true);
            onPlanUpdated?.();
          }}
        />
      )}

      <DeleteConfirmationModal
        isOpen={!!deleteConfirmationId}
        onConfirm={confirmDeleteExercise}
        onCancel={cancelDelete}
        title="Remover Exercício?"
        message="Tem certeza que deseja remover este exercício do treino?"
      />

      <DeleteConfirmationModal
        isOpen={!!deleteWorkoutConfirmationId}
        onConfirm={confirmDeleteWorkout}
        onCancel={cancelDeleteWorkout}
        title="Remover Dia de Treino?"
        message="Tem certeza que deseja remover este dia de treino? Todos os exercícios serão removidos também."
      />
    </>
  );
}
