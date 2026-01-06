"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  Dumbbell,
  GripVertical,
} from "lucide-react";
import { motion, Reorder } from "motion/react";
import { Button } from "@/components/atoms/buttons/button";
import { useModalStateWithParam } from "@/hooks/use-modal-state";
import { useStudent } from "@/hooks/use-student";
import type { Unit, WorkoutSession, WorkoutExercise } from "@/lib/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { ExerciseSearch } from "./exercise-search";
import { ModalContainer } from "./modal-container";
import { ModalHeader } from "./modal-header";
import { ModalContent } from "./modal-content";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { cn } from "@/lib/utils";

const muscleCategories = [
  { value: "", label: "Nenhum", icon: "⚪" },
  { value: "peito", label: "Peito", icon: "🫁" },
  { value: "costas", label: "Costas", icon: "🏋️" },
  { value: "pernas", label: "Pernas", icon: "🦵" },
  { value: "ombros", label: "Ombros", icon: "💪" },
  { value: "bracos", label: "Braços", icon: "💪" },
  { value: "core", label: "Core", icon: "🔥" },
  { value: "gluteos", label: "Glúteos", icon: "🍑" },
  { value: "cardio", label: "Cardio", icon: "❤️" },
  { value: "funcional", label: "Funcional", icon: "⚡" },
  { value: "full_body", label: "Corpo Inteiro", icon: "💪" },
] as const;

export function EditUnitModal() {
  const router = useRouter();
  const {
    isOpen,
    close,
    paramValue: unitId,
  } = useModalStateWithParam("editUnit", "unitId");
  const units = useStudent("units");
  const actions = useStudent("actions");

  // Consumir diretamente do Zustand - atualiza instantaneamente!
  const unit = units?.find((u: Unit) => u.id === unitId) || null;

  const [showExerciseSearch, setShowExerciseSearch] = useState(false);

  // View state
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);

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

  // Ordenar workouts por ordem antes de usar
  const sortedWorkouts = useMemo(() => {
    if (!unit?.workouts) return [];
    return [...unit.workouts].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [unit?.workouts]);

  // Sincronizar workoutItems com sortedWorkouts
  useEffect(() => {
    if (sortedWorkouts.length > 0 && workoutItems.length === 0) {
      setWorkoutItems(sortedWorkouts);
    } else if (sortedWorkouts.length !== workoutItems.length) {
      // Se a quantidade mudou (adicionou/removeu), atualizar
      setWorkoutItems(sortedWorkouts);
    }
  }, [sortedWorkouts]);

  // Calcular activeWorkout baseado nos sortedWorkouts
  const activeWorkout = useMemo(() => {
    return sortedWorkouts.find(
      (w: WorkoutSession) => w.id === editingWorkoutId
    );
  }, [sortedWorkouts, editingWorkoutId]);

  // Ordenar exercícios por ordem
  const sortedExercises = useMemo(() => {
    if (!activeWorkout?.exercises) return [];
    return [...activeWorkout.exercises].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );
  }, [activeWorkout?.exercises]);

  // Sincronizar exerciseItems com sortedExercises
  useEffect(() => {
    if (sortedExercises.length > 0 && exerciseItems.length === 0) {
      setExerciseItems(sortedExercises);
    } else if (sortedExercises.length !== exerciseItems.length) {
      // Se a quantidade mudou (adicionou/removeu), atualizar
      setExerciseItems(sortedExercises);
    }
  }, [sortedExercises]);

  // Calcular tempo estimado baseado nos exercícios
  const calculatedEstimatedTime = useMemo(() => {
    if (!activeWorkout?.exercises || activeWorkout.exercises.length === 0) {
      return 0;
    }

    const TIME_PER_REP = 2; // segundos por repetição (média)

    const totalSeconds = activeWorkout.exercises.reduce(
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
      0
    );

    // Converter para minutos e arredondar para cima
    const totalMinutes = Math.ceil(totalSeconds / 60);

    // Adicionar 10 minutos para atividades preparatórias
    // (pegar anilhas, trocar pesos, séries preparatórias, aquecimento, válidas, até a falha, etc.)
    return totalMinutes + 10;
  }, [activeWorkout?.exercises]);

  // Atualizar estimatedTime quando exercícios mudarem
  useEffect(() => {
    if (activeWorkout && calculatedEstimatedTime > 0) {
      // Só atualiza se o valor calculado for diferente do atual (com margem de 1 minuto)
      const currentTime = activeWorkout.estimatedTime || 0;
      if (Math.abs(currentTime - calculatedEstimatedTime) >= 1) {
        handleUpdateWorkout(activeWorkout.id, {
          estimatedTime: calculatedEstimatedTime,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatedEstimatedTime]);

  // Sincronizar inputs apenas quando unit mudar (mas não durante edição)
  useEffect(() => {
    if (isOpen && unitId && unit) {
      // Só atualiza os inputs se o ID mudou ou se o título/descrição local está vazio (primeira carga)
      if (!isEditingUnitInputs && title === "" && description === "") {
        setTitle(unit.title ?? "");
        setDescription(unit.description ?? "");
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
      // Limpar estados de reordenação
      setWorkoutItems([]);
      setExerciseItems([]);
    }
  }, [isOpen, unitId, unit?.id, isEditingUnitInputs]);

  // Sincronizar workoutTitle e muscleGroup quando activeWorkout mudar
  useEffect(() => {
    if (activeWorkout) {
      setWorkoutTitle(activeWorkout.title ?? "");
      setWorkoutMuscleGroup(activeWorkout.muscleGroup ?? "");
    } else {
      setWorkoutTitle("");
      setWorkoutMuscleGroup("");
    }
  }, [activeWorkout?.id, activeWorkout?.title, activeWorkout?.muscleGroup]);

  // --- Unit Actions ---

  const handleSaveUnit = async () => {
    if (!unitId) return;

    // Não precisa de setIsSaving - optimistic update já atualiza UI instantaneamente!
    try {
      await actions.updateUnit(unitId, {
        title,
        description,
      });
      // Toast apenas para feedback - UI já atualizou via optimistic update
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

  const handleDeleteWorkout = async (workoutId: string) => {
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
      const message =
        (error as any)?.response?.data?.message || "Falha ao remover treino";
      toast.error(message);
    }
  };

  const cancelDeleteWorkout = () => {
    setDeleteWorkoutConfirmationId(null);
  };

  const handleUpdateWorkout = async (
    workoutId: string,
    data: {
      title?: string;
      muscleGroup?: string;
      estimatedTime?: number;
      order?: number;
    }
  ) => {
    // Não precisa de try/catch com toast - optimistic update já atualiza UI instantaneamente!
    // Apenas chamar a action - o store gerencia tudo
    actions.updateWorkout(workoutId, data).catch((error) => {
      console.error(error);
      toast.error("Erro ao atualizar treino");
    });
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
    data: Partial<WorkoutExercise>
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
    } catch (error: any) {
      console.error(error);
      // Tratamento de erro 500 genérico para mensagem amigável
      const errorMessage =
        error.response?.data?.message ||
        "Erro ao remover exercício. Tente novamente.";
      toast.error(errorMessage);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmationId(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <ModalContainer isOpen={isOpen} onClose={close}>
        <ModalHeader
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

        <ModalContent maxHeight="none">
          {!editingWorkoutId ? (
            // --- UNIT VIEW ---
            <div className="space-y-8" style={{ minHeight: "400px" }}>
              {/* Unit Details */}
              <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                    Nome do Plano
                  </label>
                  <input
                    type="text"
                    value={title || ""}
                    onChange={(e) => setTitle(e.target.value)}
                    onFocus={() => setIsEditingUnitInputs(true)}
                    onBlur={() => setIsEditingUnitInputs(false)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-duo-green/20 focus:border-duo-green transition-all font-bold text-lg"
                    placeholder="Ex: Treino de Hipertrofia"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                    Descrição
                  </label>
                  <textarea
                    value={description || ""}
                    onChange={(e) => setDescription(e.target.value)}
                    onFocus={() => setIsEditingUnitInputs(true)}
                    onBlur={() => setIsEditingUnitInputs(false)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-duo-green/20 focus:border-duo-green transition-all resize-none h-24"
                    placeholder="Descreva o objetivo deste plano..."
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveUnit}
                    className="bg-duo-green hover:bg-duo-green-dark text-white font-bold flex items-center gap-2"
                    style={{
                      opacity: 1,
                      visibility: "visible",
                      display: "flex",
                    }}
                  >
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                  </Button>
                </div>
              </div>

              {/* Workouts List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1 mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Dias de Treino
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCreateWorkout}
                    className="border-2 font-bold hover:bg-gray-50 flex items-center gap-2 z-10 relative"
                    style={{
                      opacity: 1,
                      visibility: "visible",
                      display: "flex",
                      pointerEvents: "auto",
                      zIndex: 10,
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Dia
                  </Button>
                </div>

                {workoutItems.length > 0 ? (
                  <Reorder.Group
                    axis="y"
                    values={workoutItems}
                    onReorder={handleReorderWorkouts}
                    className="space-y-3"
                  >
                    {workoutItems.map(
                      (workout: WorkoutSession, index: number) => (
                        <Reorder.Item
                          key={workout.id}
                          value={workout}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <DuoCard
                            variant="default"
                            className="group hover:border-duo-green/50 transition-colors bg-white"
                          >
                            <div className="flex items-center gap-4">
                              {/* Handle de arrastar */}
                              <div className="flex-none cursor-grab active:cursor-grabbing text-gray-400 hover:text-duo-green transition-colors">
                                <GripVertical className="h-5 w-5" />
                              </div>
                              <div className="flex-none flex items-center justify-center w-10 h-10 rounded-2xl bg-duo-green/10 text-duo-green font-bold text-lg">
                                {index + 1}
                              </div>
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => setEditingWorkoutId(workout.id)}
                              >
                                <h4 className="font-bold text-gray-900 truncate text-lg">
                                  {workout.title}
                                </h4>
                                <p className="text-sm text-gray-500 truncate">
                                  {workout.exercises.length} exercícios •{" "}
                                  {workout.muscleGroup}
                                </p>
                              </div>
                              <div
                                className="flex items-center gap-2 z-10 relative"
                                style={{
                                  opacity: 1,
                                  visibility: "visible",
                                  display: "flex",
                                  pointerEvents: "auto",
                                  zIndex: 10,
                                }}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-gray-400 hover:text-duo-green hover:bg-duo-green/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingWorkoutId(workout.id);
                                  }}
                                  title="Editar dia de treino"
                                  style={{
                                    opacity: 1,
                                    visibility: "visible",
                                    display: "flex",
                                    pointerEvents: "auto",
                                  }}
                                >
                                  <Edit2 className="h-5 w-5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteWorkoutClick(workout.id);
                                  }}
                                  title="Remover dia de treino"
                                  style={{
                                    opacity: 1,
                                    visibility: "visible",
                                    display: "flex",
                                    pointerEvents: "auto",
                                  }}
                                >
                                  <Trash2 className="h-5 w-5" />
                                </Button>
                              </div>
                            </div>
                          </DuoCard>
                        </Reorder.Item>
                      )
                    )}
                  </Reorder.Group>
                ) : (
                  <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Dumbbell className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="font-bold">Nenhum dia de treino adicionado</p>
                    <p className="text-sm mt-1">
                      Clique em "Adicionar Dia" para começar
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // --- WORKOUT VIEW ---
            <div className="space-y-6">
              {/* Header do Workout */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                    Título do Dia
                  </label>
                  <input
                    type="text"
                    value={workoutTitle}
                    onChange={(e) => setWorkoutTitle(e.target.value)}
                    onBlur={(e) => {
                      if (
                        activeWorkout &&
                        e.target.value !== activeWorkout.title &&
                        e.target.value.trim() !== ""
                      ) {
                        handleUpdateWorkout(activeWorkout.id, {
                          title: e.target.value,
                        });
                      } else if (e.target.value.trim() === "") {
                        // Reverter se ficou vazio
                        setWorkoutTitle(activeWorkout?.title ?? "");
                      }
                    }}
                    className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-duo-green/20 focus:border-duo-green transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                    Grupo Muscular
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {muscleCategories.map((category) => (
                      <motion.button
                        key={category.value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setWorkoutMuscleGroup(category.value);
                          if (activeWorkout) {
                            handleUpdateWorkout(activeWorkout.id, {
                              muscleGroup: category.value,
                            });
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-bold transition-all",
                          workoutMuscleGroup === category.value
                            ? "border-duo-green bg-duo-green/10 text-duo-green shadow-[0_2px_0_#58A700]"
                            : "border-gray-300 bg-white text-gray-700 hover:border-duo-green/50"
                        )}
                      >
                        <span>{category.icon}</span>
                        <span>{category.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
                {calculatedEstimatedTime > 0 && (
                  <div className="rounded-xl bg-duo-green/10 border border-duo-green/20 p-3">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Tempo Estimado
                    </div>
                    <div className="text-lg font-bold text-duo-green">
                      {calculatedEstimatedTime} min
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Calculado automaticamente baseado nos exercícios
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between px-1 mb-4">
                <h3 className="text-lg font-bold text-gray-900">Exercícios</h3>
                <Button
                  size="sm"
                  onClick={handleAddExercise}
                  className="bg-duo-green hover:bg-duo-green-dark text-white font-bold flex items-center gap-2 z-10 relative"
                  style={{
                    opacity: 1,
                    visibility: "visible",
                    display: "flex",
                    pointerEvents: "auto",
                    zIndex: 10,
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Exercício
                </Button>
              </div>

              {exerciseItems.length > 0 ? (
                <Reorder.Group
                  axis="y"
                  values={exerciseItems}
                  onReorder={handleReorderExercises}
                  className="space-y-3"
                >
                  {exerciseItems.map(
                    (exercise: WorkoutExercise, index: number) => (
                      <Reorder.Item
                        key={exercise.id}
                        value={exercise}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <DuoCard
                          variant="default"
                          size="md"
                          className="group hover:border-duo-green/50 transition-all bg-white"
                        >
                          {/* Primeira div: Número, Nome e Botão de excluir */}
                          <div className="flex items-center gap-4">
                            {/* Handle de arrastar */}
                            <div className="flex-none cursor-grab active:cursor-grabbing text-gray-400 hover:text-duo-green transition-colors">
                              <GripVertical className="h-5 w-5" />
                            </div>
                            {/* Número do exercício */}
                            <div className="flex-none flex items-center justify-center w-10 h-10 rounded-2xl bg-duo-green/10 text-duo-green font-bold text-lg shrink-0">
                              {index + 1}
                            </div>

                            {/* Nome do exercício */}
                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                defaultValue={exercise.name ?? ""}
                                onBlur={(e) =>
                                  handleUpdateExercise(exercise.id, {
                                    name: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-white hover:border-gray-300 focus:bg-white focus:border-duo-green focus:outline-none focus:ring-2 focus:ring-duo-green/20 font-bold text-base transition-all"
                                placeholder="Nome do exercício"
                              />
                            </div>

                            {/* Botão de deletar */}
                            <div
                              className="flex-none z-10 relative"
                              style={{
                                opacity: 1,
                                visibility: "visible",
                                display: "flex",
                                pointerEvents: "auto",
                                zIndex: 10,
                              }}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                onClick={() =>
                                  handleDeleteExercise(exercise.id)
                                }
                                title="Remover exercício"
                                style={{
                                  opacity: 1,
                                  visibility: "visible",
                                  display: "flex",
                                  pointerEvents: "auto",
                                }}
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>

                          {/* Segunda div: Séries, Repetições e Descanso */}
                          <div className="grid grid-cols-3 gap-3 mt-4">
                            <div className="flex flex-col gap-1.5 bg-gray-50 rounded-xl p-3 border border-gray-100 hover:bg-gray-100 transition-colors items-center justify-center">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-full">
                                Séries
                              </label>
                              <input
                                type="number"
                                defaultValue={exercise.sets ?? 0}
                                onBlur={(e) =>
                                  handleUpdateExercise(exercise.id, {
                                    sets: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full bg-transparent font-bold text-gray-900 text-center text-lg focus:outline-none border-b-2 border-transparent focus:border-duo-green transition-colors"
                                min="0"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5 bg-gray-50 rounded-xl p-3 border border-gray-100 hover:bg-gray-100 transition-colors items-center justify-center">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-full">
                                Repetições
                              </label>
                              <input
                                type="text"
                                defaultValue={exercise.reps ?? ""}
                                onBlur={(e) =>
                                  handleUpdateExercise(exercise.id, {
                                    reps: e.target.value,
                                  })
                                }
                                className="w-full bg-transparent font-bold text-gray-900 text-center text-lg focus:outline-none border-b-2 border-transparent focus:border-duo-green transition-colors"
                                placeholder="8-12"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5 bg-gray-50 rounded-xl p-3 border border-gray-100 hover:bg-gray-100 transition-colors items-center justify-center">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-full">
                                Descanso
                              </label>
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  defaultValue={exercise.rest ?? 0}
                                  onBlur={(e) =>
                                    handleUpdateExercise(exercise.id, {
                                      rest: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="w-full bg-transparent font-bold text-gray-900 text-center text-lg focus:outline-none border-b-2 border-transparent focus:border-duo-green transition-colors"
                                  min="0"
                                />
                                <span className="text-xs font-bold text-gray-400">
                                  s
                                </span>
                              </div>
                            </div>
                          </div>
                        </DuoCard>
                      </Reorder.Item>
                    )
                  )}
                </Reorder.Group>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p>Nenhum exercício neste dia.</p>
                </div>
              )}
            </div>
          )}
        </ModalContent>
      </ModalContainer>

      {showExerciseSearch && editingWorkoutId && isOpen && (
        <ExerciseSearch
          workoutId={editingWorkoutId}
          onClose={() => setShowExerciseSearch(false)}
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
