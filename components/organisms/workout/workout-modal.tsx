"use client";

import { useState, useEffect, useRef } from "react";
import { mockWorkouts } from "@/lib/mock-data";
import {
  X,
  Heart,
  Zap,
  Weight,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Timer,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/atoms/buttons/button";
import { WeightTracker } from "../trackers/weight-tracker";
import { ExerciseAlternativeSelector } from "../modals/exercise-alternative-selector";
import { WorkoutHeader } from "./workout/workout-header";
import { WorkoutCompletionView } from "./workout/workout-completion-view";
import { CardioConfigModal } from "./workout/cardio-config-modal";
import { WeightTrackerOverlay } from "./workout/weight-tracker-overlay";
import { ExerciseCardView } from "./workout/exercise-card-view";
import { WorkoutFooter } from "./workout/workout-footer";
import type {
  ExerciseLog,
  WorkoutExercise,
  WorkoutSession,
  AlternativeExercise,
  Unit,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useWorkoutStore, useUIStore } from "@/stores";
import { useStudent } from "@/hooks/use-student";
import { useRouter } from "next/navigation";
import {
  useModalState,
  useModalStateWithParam,
  useSubModalState,
} from "@/hooks/use-modal-state";
import { parseAsInteger, useQueryState } from "nuqs";

/**
 * Converte exerciseLogs do formato frontend para o formato esperado pela API
 * - Converte "ideal" → "medio"
 * - Normaliza hífens para underscores ("muito-facil" → "muito_facil")
 * - Remove campos extras e garante tipos corretos
 */
function convertExerciseLogsForAPI(logs: ExerciseLog[]): Array<{
  exerciseId: string;
  exerciseName: string;
  sets: Array<{
    weight: number | null;
    reps: number | null;
    completed: boolean;
    notes: string | null;
  }>;
  notes: string | null;
  formCheckScore: number | null;
  difficulty:
    | "muito_facil"
    | "facil"
    | "medio"
    | "dificil"
    | "muito_dificil"
    | null;
}> {
  return logs
    .filter((log) => log && log.exerciseId && log.exerciseName)
    .map((log) => {
      // Converter difficulty do formato frontend para o formato do schema
      let difficulty:
        | "muito_facil"
        | "facil"
        | "medio"
        | "dificil"
        | "muito_dificil"
        | null = null;

      if (log.difficulty) {
        const normalized = log.difficulty.replace(/-/g, "_");
        if (normalized === "ideal") {
          difficulty = "medio";
        } else if (normalized === "muito_facil") {
          difficulty = "muito_facil";
        } else if (normalized === "facil") {
          difficulty = "facil";
        } else if (normalized === "medio") {
          difficulty = "medio";
        } else if (normalized === "dificil") {
          difficulty = "dificil";
        } else if (normalized === "muito_dificil") {
          difficulty = "muito_dificil";
        }
      }

      return {
        exerciseId: log.exerciseId,
        exerciseName: log.exerciseName,
        sets:
          log.sets?.map((set) => ({
            weight: set.weight ?? null,
            reps: set.reps ?? null,
            completed: set.completed ?? false,
            notes: set.notes ?? null,
          })) ?? [],
        notes: log.notes ?? null,
        formCheckScore: log.formCheckScore ?? null,
        difficulty: difficulty,
      };
    });
}

export function WorkoutModal() {
  const router = useRouter();
  const workoutModal = useModalStateWithParam("workout", "workoutId");
  const openWorkoutId = workoutModal.paramValue;
  const [exerciseIndexParam, setExerciseIndexParam] = useQueryState(
    "exerciseIndex",
    parseAsInteger
  );
  const activeWorkout = useWorkoutStore((state) => state.activeWorkout);

  // Estado para forçar re-render quando workout for encontrado
  const [, forceUpdate] = useState(0);

  // Buscar units do store unificado (fonte única da verdade)
  // Dados são carregados automaticamente pelo useStudentInitializer no layout
  const units = useStudent("units");

  // Se há workoutId na URL mas modal não está aberto, abrir automaticamente
  // OU se modal=workout está na URL mas não há workoutId, garantir que workoutId está presente
  useEffect(() => {
    if (openWorkoutId && !workoutModal.isOpen) {
      // Adicionar modal=workout à URL se não estiver presente
      workoutModal.open(openWorkoutId);
    }
    // NÃO fechar o modal automaticamente - deixar o usuário fechar manualmente
    // Isso permite reabrir workouts completados
  }, [openWorkoutId, workoutModal]);

  // Buscar workout das units do store unificado ou do mock como fallback
  const findWorkoutInUnits = (workoutId: string): WorkoutSession | null => {
    if (!units || !Array.isArray(units) || units.length === 0) return null;

    for (const unit of units) {
      const workout = unit.workouts.find(
        (w: WorkoutSession) => w.id === workoutId
      );
      if (workout) return workout;
    }
    return null;
  };

  const workoutBase = openWorkoutId
    ? findWorkoutInUnits(openWorkoutId) ||
      mockWorkouts.find((w) => w.id === openWorkoutId) ||
      null
    : null;

  // Tentar buscar workout periodicamente se não foi encontrado ainda
  useEffect(() => {
    if (openWorkoutId && !workoutBase && units && units.length > 0) {
      // Tentar buscar novamente após um pequeno delay
      const timer = setTimeout(() => {
        const retryWorkout =
          findWorkoutInUnits(openWorkoutId) ||
          mockWorkouts.find((w) => w.id === openWorkoutId);
        if (retryWorkout) {
          forceUpdate((prev) => prev + 1);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [openWorkoutId, workoutBase, units]);
  const {
    setActiveWorkout,
    setCurrentExerciseIndex,
    addExerciseLog,
    saveWorkoutProgress,
    loadWorkoutProgress,
    completeWorkout,
    clearWorkoutProgress,
    openWorkout,
    skipExercise,
    calculateWorkoutStats,
    isWorkoutCompleted,
    selectAlternative,
    setCardioPreference,
  } = useWorkoutStore();
  const actions = useStudent("actions");
  const loaders = useStudent("loaders");
  const { progress: studentProgress } = useStudent("progress");

  const completeStudentWorkout = actions?.completeWorkout;
  const updateProgress = actions?.updateProgress;
  const loadProgress = loaders?.loadProgress;

  // Verificar se as funções estão disponíveis
  if (!completeStudentWorkout || typeof completeStudentWorkout !== "function") {
    console.error("❌ completeStudentWorkout não está disponível:", {
      actions,
      hasCompleteWorkout: !!actions?.completeWorkout,
      type: typeof actions?.completeWorkout,
    });
  }
  if (!updateProgress || typeof updateProgress !== "function") {
    console.error("❌ updateProgress não está disponível:", {
      actions,
      hasUpdateProgress: !!actions?.updateProgress,
      type: typeof actions?.updateProgress,
    });
  }

  // Helper para adicionar XP (atualiza progress)
  const addXP = async (amount: number) => {
    if (studentProgress && updateProgress) {
      await updateProgress({
        totalXP: (studentProgress.totalXP || 0) + amount,
        todayXP: (studentProgress.todayXP || 0) + amount,
      });
    }
  };
  // Sub-modais controlados por search params (usam subModal para não fechar o modal principal)
  const weightTrackerModal = useSubModalState("weight-tracker");
  const alternativeSelectorModal = useSubModalState("alternative-selector");
  const cardioConfigModal = useSubModalState("cardio-config");
  const [showCompletion, setShowCompletion] = useState(false);

  // Manter compatibilidade com UIStore temporariamente
  const { showWeightTracker } = useUIStore();

  // Estados específicos de cardio
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // em segundos
  const [calories, setCalories] = useState(0);
  const [heartRate, setHeartRate] = useState(120);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Salvar dados do workout completado para mostrar na tela de conclusão
  const [completedWorkoutData, setCompletedWorkoutData] = useState<{
    exerciseLogs: ExerciseLog[];
    xpEarned: number;
    totalTime?: number;
    totalCalories?: number;
    avgHeartRate?: number;
    skippedExercises?: string[]; // IDs dos exercícios pulados
  } | null>(null);

  // Função para criar exercícios de cardio baseado na duração
  const createCardioExercises = (duration: number): WorkoutExercise[] => {
    const cardioTypes = {
      corrida: {
        name: "Corrida na Esteira",
        icon: "🏃",
        alternatives: [
          {
            id: "alt-corrida-rua",
            name: "Corrida ao Ar Livre",
            reason: "Sem esteira disponível",
          },
          {
            id: "alt-corrida-bike",
            name: "Bicicleta",
            reason: "Menor impacto nas articulações",
          },
        ],
      },
      bicicleta: {
        name: "Bicicleta Ergométrica",
        icon: "🚴",
        alternatives: [
          {
            id: "alt-bike-remo",
            name: "Remo Ergométrico",
            reason: "Trabalha mais grupos musculares",
          },
          {
            id: "alt-bike-eliptico",
            name: "Elíptico",
            reason: "Menor impacto nas articulações",
          },
        ],
      },
      eliptico: {
        name: "Elíptico",
        icon: "🎯",
        alternatives: [
          {
            id: "alt-eliptico-bike",
            name: "Bicicleta",
            reason: "Equipamento ocupado",
          },
          {
            id: "alt-eliptico-stair",
            name: "Escada Ergométrica",
            reason: "Maior intensidade",
          },
        ],
      },
      "pular-corda": {
        name: "Pular Corda",
        icon: "🪢",
        alternatives: [
          {
            id: "alt-corda-jumping",
            name: "Jumping Jacks",
            reason: "Sem corda disponível",
          },
          {
            id: "alt-corda-burpees",
            name: "Burpees",
            reason: "Maior intensidade",
          },
        ],
      },
    };

    // Usar o cardio salvo no activeWorkout ou gerar novo
    const savedCardioType =
      activeWorkout?.selectedCardioType as keyof typeof cardioTypes;
    const cardioTypeKeys = Object.keys(
      cardioTypes
    ) as (keyof typeof cardioTypes)[];
    const selectedType =
      savedCardioType && cardioTypes[savedCardioType]
        ? savedCardioType
        : cardioTypeKeys[0];

    const selected = cardioTypes[selectedType];

    return [
      {
        id: `cardio-${selectedType}`,
        name: `${selected.icon} ${selected.name}`,
        sets: 1,
        reps: `${duration} minutos`,
        rest: 0,
        notes: `Mantenha uma intensidade moderada. Meta: ${duration} minutos contínuos.`,
        completed: false,
        alternatives: selected.alternatives,
      },
    ];
  };

  // Aplicar preferência de cardio ao workout
  const workout = workoutBase
    ? (() => {
        if (
          !activeWorkout?.cardioPreference ||
          activeWorkout.cardioPreference === "none"
        ) {
          return workoutBase;
        }

        const cardioExercises = createCardioExercises(
          activeWorkout.cardioDuration || 10
        );

        return {
          ...workoutBase,
          exercises:
            activeWorkout.cardioPreference === "before"
              ? [...cardioExercises, ...workoutBase.exercises]
              : [...workoutBase.exercises, ...cardioExercises],
        };
      })()
    : null;

  // Inicializar workout quando abrir ou quando workoutId mudar
  useEffect(() => {
    // Função assíncrona para inicializar workout
    const initializeWorkout = async () => {
      // Se não tem workoutId, limpar tudo
      if (!openWorkoutId) {
        setActiveWorkout(null);
        setShowCompletion(false);
        weightTrackerModal.close();
        setIsRunning(false);
        setElapsedTime(0);
        setCalories(0);
        cardioConfigModal.close();
        // Limpar exerciseIndex da URL
        setExerciseIndexParam(null);
        return;
      }

      // Se tem workoutId mas não tem workout ainda, tentar buscar novamente
      if (!workout) {
        // Tentar buscar o workout (pode estar carregando)
        const retryWorkout =
          findWorkoutInUnits(openWorkoutId) ||
          mockWorkouts.find((w) => w.id === openWorkoutId);

        // Se ainda não encontrou, aguardar próximo render (workout pode estar carregando)
        if (!retryWorkout) {
          return;
        }

        // Se encontrou, usar esse workout para inicializar
        // Mas não podemos modificar workout aqui, então vamos continuar
        // O workout será recalculado no próximo render
      }

      // Se não tem workout ainda após tentar buscar, aguardar e tentar novamente
      if (!workout) {
        // Se modal está aberto, tentar buscar novamente após um delay
        // Isso é útil quando acessado diretamente pela URL e as units ainda não foram carregadas
        if (workoutModal.isOpen) {
          // Tentar buscar novamente após um delay
          const retryTimer = setTimeout(() => {
            const retryWorkout =
              findWorkoutInUnits(openWorkoutId) ||
              mockWorkouts.find((w) => w.id === openWorkoutId);

            if (retryWorkout) {
              // Se encontrou, forçar re-render para inicializar
              forceUpdate((prev) => prev + 1);
            } else {
              // Se ainda não encontrou, tentar mais uma vez após outro delay
              const secondRetryTimer = setTimeout(() => {
                forceUpdate((prev) => prev + 1);
              }, 1000);
              return () => clearTimeout(secondRetryTimer);
            }
          }, 500);
          return () => clearTimeout(retryTimer);
        }
        return;
      }

      // Sempre resetar tela de conclusão quando abrir
      setShowCompletion(false);
      weightTrackerModal.close();
      setCompletedWorkoutData(null);
      setIsRunning(false);
      setElapsedTime(0);
      setCalories(0);

      // Carregar progresso salvo do localStorage (Zustand persist)
      // Não fazer GET - dados já estão no store
      const savedProgress = loadWorkoutProgress(workout.id);
      const isCompleted = isWorkoutCompleted(workout.id);

      // Determinar índice inicial do exercício
      // Prioridade: 1) exerciseIndex da URL, 2) progresso salvo, 3) 0
      let initialExerciseIndex = 0;
      if (exerciseIndexParam !== null && exerciseIndexParam !== undefined) {
        // Se há exerciseIndex na URL, usar ele (validar se está dentro do range)
        initialExerciseIndex = Math.max(
          0,
          Math.min(exerciseIndexParam, workout.exercises.length - 1)
        );
      } else if (savedProgress) {
        // Se não há exerciseIndex na URL mas tem progresso salvo, usar o índice salvo
        // Permitir reabrir workouts completados - usar o índice salvo mesmo se completo
        initialExerciseIndex = savedProgress.currentExerciseIndex;
      }

      // Inicializar workout com dados salvos se existirem
      // Permitir reabrir workouts completados - sempre restaurar progresso se existir
      if (savedProgress) {
        // Restaurar workout completo com todos os dados salvos
        // Usar o índice determinado acima (da URL ou salvo)
        useWorkoutStore.setState({
          activeWorkout: {
            workoutId: workout.id,
            currentExerciseIndex: initialExerciseIndex,
            exerciseLogs: savedProgress.exerciseLogs || [],
            skippedExercises: savedProgress.skippedExercises || [],
            xpEarned: savedProgress.xpEarned || 0,
            totalVolume: savedProgress.totalVolume || 0,
            completionPercentage: savedProgress.completionPercentage || 0,
            startTime: savedProgress.startTime || new Date(),
            lastUpdated: new Date(),
            selectedAlternatives: savedProgress.selectedAlternatives || {},
            cardioPreference: savedProgress.cardioPreference,
            cardioDuration: savedProgress.cardioDuration,
            selectedCardioType: savedProgress.selectedCardioType,
          },
        });
        // Se tem progresso salvo mas não tem preferência de cardio configurada E é treino de força
        // Mostrar config de cardio (apenas se estiver no primeiro exercício e não estiver completo)
        if (
          workout.type === "strength" &&
          !savedProgress.cardioPreference &&
          initialExerciseIndex === 0 &&
          !isCompleted
        ) {
          cardioConfigModal.open();
        } else {
          cardioConfigModal.close();
        }
      } else {
        // Inicializar workout novo com o índice da URL se disponível
        setActiveWorkout(workout);
        if (initialExerciseIndex > 0) {
          setCurrentExerciseIndex(initialExerciseIndex);
        }
        // Mostrar tela de configuração de cardio apenas para treinos de força
        if (workout.type === "strength") {
          cardioConfigModal.open();
        } else {
          cardioConfigModal.close();
        }
      }
    };

    // Executar inicialização
    initializeWorkout();

    return () => {
      // Limpar cronômetro de cardio
      if (intervalRef.current) clearInterval(intervalRef.current);
      // NÃO salvar progresso aqui - isso causa loop infinito
      // O progresso é salvo explicitamente em handleClose()
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openWorkoutId, exerciseIndexParam]);

  // Cronômetro para exercícios de cardio
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
        // Simular calorias (5 cal/min em média)
        setCalories((prev) => prev + 5 / 60);
        // Simular variação de FC
        setHeartRate((prev) => {
          const variation = Math.random() * 10 - 5;
          return Math.max(100, Math.min(180, prev + variation));
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Disparar evento customizado para atualizar outros componentes quando há mudanças
  useEffect(() => {
    if (!workout || !activeWorkout) return;

    // Apenas disparar evento, NÃO salvar progresso aqui
    // O progresso é salvo explicitamente em cada ação (completar, pular, fechar, etc)
    window.dispatchEvent(
      new CustomEvent("workoutProgressUpdate", {
        detail: {
          workoutId: workout.id,
          progress: {
            currentExerciseIndex: activeWorkout.currentExerciseIndex,
            exerciseLogs: activeWorkout.exerciseLogs,
            skippedExercises: activeWorkout.skippedExercises,
            xpEarned: activeWorkout.xpEarned,
            totalVolume: activeWorkout.totalVolume,
            completionPercentage: activeWorkout.completionPercentage,
          },
        },
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    workout?.id,
    activeWorkout?.currentExerciseIndex,
    activeWorkout?.exerciseLogs?.length,
    activeWorkout?.skippedExercises?.length,
  ]);

  // Debug: Log workout data - DEVE ficar ANTES dos returns condicionais
  useEffect(() => {
    if (!workout || !activeWorkout) return;
    const currentExercise =
      workout.exercises[activeWorkout.currentExerciseIndex];
    if (currentExercise) {
      console.log("🏋️ Workout Debug:", {
        workoutId: workout.id,
        exerciseName: currentExercise.name,
        hasAlternatives: !!currentExercise.alternatives,
        alternativesLength: currentExercise.alternatives?.length,
        alternatives: currentExercise.alternatives,
        fullExercise: currentExercise,
      });
    }
  }, [workout, activeWorkout, activeWorkout?.currentExerciseIndex]);

  // Não renderizar nada se não houver workoutId na URL ou se modal não está aberto
  // Mas permitir renderizar se estiver mostrando a tela de conclusão
  // Verificar se modal está aberto OU se há workoutId na URL (para abrir automaticamente)
  const shouldRender = workoutModal.isOpen || openWorkoutId;
  if (!shouldRender) {
    return null;
  }

  // Se modal está aberto mas não tem workoutId, não renderizar
  if (workoutModal.isOpen && !openWorkoutId) {
    return null;
  }

  // Aplicar preferência de cardio ao workout (definir workout antes de usar)
  // Usar workout já definido acima (linha 247)
  // Se não tem workout ainda mas tem workoutId, tentar buscar novamente
  // Isso pode acontecer se as units ainda não foram carregadas
  // MAS: se modal está aberto, renderizar mesmo sem workout (mostrar loading)
  if (!workout && openWorkoutId && !workoutModal.isOpen) {
    // Se não tem modal=workout na URL, não renderizar até ter workout
    return null;
  }

  // Se não está mostrando conclusão e não tem activeWorkout, verificar se tem workoutId
  // Se tem workoutId, aguardar inicialização (não retornar null imediatamente)
  if (!showCompletion && !activeWorkout) {
    // Se não tem workoutId, não renderizar
    if (!openWorkoutId) {
      return null;
    }
    // Se tem workoutId mas não tem workout ainda E modal está aberto, renderizar (mostrar loading)
    // Se modal não está aberto, aguardar workout antes de renderizar
    if (!workout && !workoutModal.isOpen) {
      return null;
    }
  }

  // Se não tem workout, mas modal está aberto, aguardar carregamento
  // Se modal não está aberto e não tem workout, não renderizar
  if (!workout) {
    // Se modal está aberto, renderizar um loading ou aguardar
    // O useEffect vai tentar buscar o workout
    if (workoutModal.isOpen && openWorkoutId) {
      // Renderizar um estado de loading enquanto busca o workout
      // Isso permite que o modal seja visível mesmo quando o workout ainda não foi encontrado
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-duo-blue border-t-transparent" />
              <p className="text-sm text-duo-gray-dark">Carregando treino...</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  // Verificar se workout tem exercises antes de continuar
  if (!workout.exercises || workout.exercises.length === 0) {
    return null;
  }

  // Se está mostrando conclusão, não precisa do currentExercise
  // Verificar se workout existe antes de acessar exercises
  const currentExercise =
    activeWorkout && workout && workout.exercises
      ? workout.exercises[activeWorkout.currentExerciseIndex]
      : null;

  // Obter o nome do exercício considerando alternativa selecionada
  const getCurrentExerciseName = () => {
    if (!currentExercise || !activeWorkout) return "";
    const alternativeId =
      activeWorkout.selectedAlternatives?.[currentExercise.id];
    if (alternativeId && currentExercise.alternatives) {
      const alternative = currentExercise.alternatives.find(
        (alt: AlternativeExercise) => alt.id === alternativeId
      );
      return alternative?.name || currentExercise.name;
    }
    return currentExercise.name;
  };

  // Função para navegar para conteúdo educacional
  const handleViewEducation = async (educationalId: string) => {
    console.log("[DEBUG] handleViewEducation chamado:", {
      educationalId,
      workoutId: workout?.id,
      hasActiveWorkout: !!activeWorkout,
    });

    // Salvar progresso em background antes de navegar (não bloquear)
    if (workout && activeWorkout) {
      saveWorkoutProgress(workout.id).catch((error) => {
        console.error("Erro ao salvar progresso em background:", error);
      });
    }

    // Fechar modais antes de navegar
    alternativeSelectorModal.close();
    workoutModal.close();

    // Pequeno delay para garantir que os modais fechem antes de navegar
    setTimeout(() => {
      // Navegar para página de educação com exercício específico
      // Usar window.location para garantir que a navegação seja completa
      // Isso força uma navegação completa e garante que os query params sejam lidos
      const url = `/student?tab=education&view=muscles&exercise=${educationalId}`;
      console.log("[DEBUG] Navegando para:", url);
      window.location.href = url;
    }, 100);
  };

  // Função para selecionar alternativa
  const handleSelectAlternative = async (
    exerciseId: string,
    alternativeId?: string
  ) => {
    // OTIMISTIC UPDATE: Atualizar Zustand primeiro (instantâneo)
    selectAlternative(exerciseId, alternativeId);
    alternativeSelectorModal.close();

    // Salvar progresso em background (não bloquear UI)
    if (workout) {
      saveWorkoutProgress(workout.id).catch((error) => {
        console.error("Erro ao salvar progresso em background:", error);
      });
    }
  };

  // Verificar se o exercício atual é cardio
  const isCurrentExerciseCardio = () => {
    // Verifica se é um exercício de cardio baseado no ID (cardio-xxx)
    // ou se o workout inteiro é do tipo cardio
    return (
      workout?.type === "cardio" ||
      currentExercise?.id?.startsWith("cardio-") ||
      currentExercise?.name?.toLowerCase().includes("cardio")
    );
  };

  // Verificar se o exercício atual é unilateral (baseado no nome)
  const isCurrentExerciseUnilateral = () => {
    if (!currentExercise) return false;
    const nameLower = currentExercise.name.toLowerCase();
    return (
      nameLower.includes("unilateral") ||
      nameLower.includes("pistol") ||
      nameLower.includes("single-leg") ||
      nameLower.includes("single-arm")
    );
  };

  // Buscar log existente do exercício atual
  const getCurrentExerciseLog = (): ExerciseLog | null => {
    if (!activeWorkout || !currentExercise) return null;
    return (
      activeWorkout.exerciseLogs.find(
        (log) => log.exerciseId === currentExercise.id
      ) || null
    );
  };

  // Formatar tempo para MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Calcular progresso baseado no índice atual do exercício
  // O progresso deve refletir quantos exercícios já foram vistos (completados ou pulados)
  // Mas também considerar o índice atual para atualizar quando voltar
  const totalExercises = workout.exercises.length;
  const completedCount = activeWorkout?.exerciseLogs?.length || 0;
  const skippedCount = activeWorkout?.skippedExercises?.length || 0;
  const currentIndex = activeWorkout?.currentExerciseIndex || 0;

  // Progresso baseado em exercícios já completados/pulados + o exercício atual
  // Se estou no índice 0, ainda não vi nenhum = 0%
  // Se estou no índice 1, já vi 1 exercício = (1/total) * 100
  // Mas se já completei/pulei mais exercícios, usar o maior valor
  const seenByIndex = currentIndex; // Exercícios vistos até o índice atual
  const seenByLogs = completedCount + skippedCount; // Exercícios realmente completados/pulados
  const totalSeen = Math.max(seenByIndex, seenByLogs);

  const workoutProgress =
    totalExercises > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((totalSeen / totalExercises) * 100))
        )
      : 0;
  const hearts = 5;

  // Salvar progresso sem fechar modal (chamado quando completa série)
  const handleSaveProgress = async (log: ExerciseLog) => {
    console.log("💾 handleSaveProgress CHAMADO (salvar sem fechar):", {
      exerciseName: log.exerciseName,
      logId: log.id,
      sets: log.sets.length,
      completedSets: log.sets.filter((s) => s.completed).length,
    });

    // Verificar se já existe um log para este exercício
    const existingLogIndex = activeWorkout?.exerciseLogs.findIndex(
      (l) => l.exerciseId === log.exerciseId
    );

    if (existingLogIndex !== undefined && existingLogIndex >= 0) {
      // Atualizar log existente
      const { updateExerciseLog } = useWorkoutStore.getState();
      updateExerciseLog(log.exerciseId, log);
      calculateWorkoutStats();
    } else {
      // Adicionar novo log do exercício
      addExerciseLog(log);
    }

    // Salvar progresso em background (não bloquear UI)
    if (workout) {
      saveWorkoutProgress(workout.id).catch((error) => {
        console.error("Erro ao salvar progresso em background:", error);
      });
    }
  };

  const handleExerciseComplete = async (log: ExerciseLog) => {
    console.log("🚀 handleExerciseComplete CHAMADO:", {
      exerciseName: log.exerciseName,
      logId: log.id,
      currentIndex: activeWorkout?.currentExerciseIndex,
      totalExercises: workout?.exercises.length,
    });

    // Verificar se já existe um log para este exercício
    const existingLogIndex = activeWorkout?.exerciseLogs.findIndex(
      (l) => l.exerciseId === log.exerciseId
    );

    if (existingLogIndex !== undefined && existingLogIndex >= 0) {
      // Atualizar log existente ao invés de adicionar novo
      console.log("🔄 Atualizando log existente:", {
        exerciseId: log.exerciseId,
        existingLogIndex,
        oldSets: activeWorkout?.exerciseLogs[existingLogIndex]?.sets.length,
        newSets: log.sets.length,
      });
      const { updateExerciseLog } = useWorkoutStore.getState();
      updateExerciseLog(log.exerciseId, log);
      
      // Recalcular estatísticas após atualizar
      calculateWorkoutStats();
    } else {
      // Adicionar novo log do exercício
      addExerciseLog(log);
    }
    console.log(
      "✅ Exercício completado:",
      log.exerciseName,
      "| Log ID:",
      log.id,
      "| Tipo:",
      log.exerciseName.toLowerCase().includes("cardio") ||
        log.exerciseName.toLowerCase().includes("bicicleta") ||
        log.exerciseName.toLowerCase().includes("corrida") ||
        log.exerciseName.toLowerCase().includes("pular")
        ? "CARDIO"
        : "FORÇA"
    );
    weightTrackerModal.close();

    // Calcular estatísticas atualizadas
    calculateWorkoutStats();

    // Calcular XP ganho neste exercício
    const xpPerExercise = Math.round(
      workout.xpReward / workout.exercises.length
    );
    // Atualizar XP no store
    const currentState = useWorkoutStore.getState();
    if (currentState.activeWorkout) {
      const newXpEarned =
        (currentState.activeWorkout.xpEarned || 0) + xpPerExercise;
      useWorkoutStore.setState({
        activeWorkout: {
          ...currentState.activeWorkout,
          xpEarned: newXpEarned,
        },
      });
    }

    // Salvar progresso em background (não bloquear UI)
    saveWorkoutProgress(workout.id).catch((error) => {
      console.error("Erro ao salvar progresso em background:", error);
    });

    if (!activeWorkout) return;

    if (activeWorkout.currentExerciseIndex + 1 >= workout.exercises.length) {
      console.log("🔚 Último exercício completado! Salvando dados...", {
        currentIndex: activeWorkout.currentExerciseIndex,
        totalExercises: workout.exercises.length,
        logId: log.id,
        logName: log.exerciseName,
      });

      // Aguardar um tick para garantir que o estado foi atualizado
      setTimeout(async () => {
        // Obter estado final DEPOIS de adicionar o log
        const finalState = useWorkoutStore.getState();
        const finalActiveWorkout = finalState.activeWorkout;

        console.log("🔍 Estado do store ao salvar (força - último):", {
          hasActiveWorkout: !!finalActiveWorkout,
          exerciseLogsCount: finalActiveWorkout?.exerciseLogs?.length || 0,
          exerciseLogs:
            finalActiveWorkout?.exerciseLogs?.map((l) => ({
              name: l.exerciseName,
              id: l.id,
            })) || [],
          currentLogId: log.id,
        });

        // Salvar dados para a tela de conclusão ANTES de limpar o activeWorkout
        // Incluir o log atual que acabou de ser adicionado
        if (!finalActiveWorkout) {
          console.error(
            "❌ finalActiveWorkout é null! Não é possível salvar dados."
          );
          return;
        }

        // Garantir que o log atual está incluído (pode não estar ainda no array)
        const allLogs = finalActiveWorkout.exerciseLogs || [];
        const logExists = allLogs.some((l) => l.id === log.id);
        const finalLogs = logExists ? allLogs : [...allLogs, log];

        console.log("📊 Salvando dados de conclusão (força - último):", {
          totalLogs: finalLogs.length,
          logs: finalLogs.map((l) => ({
            name: l.exerciseName,
            id: l.id,
            type:
              l.exerciseName.toLowerCase().includes("cardio") ||
              l.exerciseName.toLowerCase().includes("bicicleta") ||
              l.exerciseName.toLowerCase().includes("corrida") ||
              l.exerciseName.toLowerCase().includes("pular")
                ? "CARDIO"
                : "FORÇA",
          })),
          storeLogs: allLogs.length,
          currentLogId: log.id,
          logExists,
        });

        setCompletedWorkoutData({
          exerciseLogs: finalLogs,
          xpEarned: finalActiveWorkout.xpEarned || 0,
          skippedExercises: finalActiveWorkout.skippedExercises || [],
        });

        console.log("✅ setCompletedWorkoutData chamado com:", {
          exerciseLogsCount: finalLogs.length,
          exerciseLogs: finalLogs.map((l) => l.exerciseName),
        });

        // Calcular duração do workout
        const workoutDuration = finalActiveWorkout.startTime
          ? Math.round(
              (new Date().getTime() -
                new Date(finalActiveWorkout.startTime).getTime()) /
                60000
            )
          : workout.estimatedTime;

        // Calcular volume total
        const totalVolume = finalActiveWorkout.totalVolume || 0;

        // Determinar feedback baseado em performance
        let overallFeedback: "excelente" | "bom" | "regular" | "ruim" = "bom";
        const completedExercises = finalLogs.length;
        const totalExercises = workout.exercises.length;
        const completionRate = completedExercises / totalExercises;

        if (completionRate >= 0.9 && totalVolume > 0) {
          overallFeedback = "excelente";
        } else if (completionRate >= 0.7) {
          overallFeedback = "bom";
        } else if (completionRate >= 0.5) {
          overallFeedback = "regular";
        } else {
          overallFeedback = "ruim";
        }

        // Determinar partes do corpo fatigadas baseado no muscleGroup
        const bodyPartsFatigued = [workout.muscleGroup];

        // Salvar workout no backend
        const saveWorkoutToBackend = async () => {
          try {
            // Usar axios client (API → Zustand → Component)
            const { apiClient } = await import("@/lib/api/client");

            // Garantir que startTime seja uma string ISO
            const startTimeValue = finalActiveWorkout?.startTime || new Date();
            const startTimeISO =
              startTimeValue instanceof Date
                ? startTimeValue.toISOString()
                : typeof startTimeValue === "string"
                ? startTimeValue
                : new Date(startTimeValue).toISOString();

            // Converter exerciseLogs para o formato esperado pela API
            const exerciseLogs = convertExerciseLogsForAPI(finalLogs || []);

            // Garantir que bodyPartsFatigued seja um array válido
            const validBodyPartsFatigued = Array.isArray(bodyPartsFatigued)
              ? bodyPartsFatigued.filter(
                  (part) => part && typeof part === "string"
                )
              : [];

            const requestBody: any = {
              exerciseLogs: exerciseLogs,
              duration: workoutDuration,
              totalVolume: totalVolume || 0,
              overallFeedback: overallFeedback,
              xpEarned: finalActiveWorkout?.xpEarned || workout.xpReward,
              startTime: startTimeISO,
            };

            // Adicionar bodyPartsFatigued apenas se não estiver vazio
            if (validBodyPartsFatigued.length > 0) {
              requestBody.bodyPartsFatigued = validBodyPartsFatigued;
            }

            const response = await apiClient.post(
              `/api/workouts/${workout.id}/complete`,
              requestBody
            );
            console.log("Workout salvo com sucesso:", response.data);
          } catch (error: any) {
            console.error(
              "Erro ao salvar workout no backend:",
              error?.message || error
            );
            // Continuar mesmo se falhar
          }
        };

        // Salvar no backend (não bloquear UI)
        saveWorkoutToBackend();

        // Marcar como completo e atualizar XP/streak (otimisticamente)
        // completeWorkout espera um objeto WorkoutCompletionData
        const xpEarned = finalActiveWorkout.xpEarned || workout.xpReward;
        // completeStudentWorkout já chama loadProgress internamente
        if (
          completeStudentWorkout &&
          typeof completeStudentWorkout === "function"
        ) {
          await completeStudentWorkout({
            workoutId: workout.id,
            exercises: finalLogs,
            duration: workoutDuration,
            totalVolume: totalVolume,
            overallFeedback: overallFeedback,
            bodyPartsFatigued: bodyPartsFatigued,
            xpEarned: xpEarned, // Passar xpEarned para atualizar progresso
          });
        } else {
          console.error(
            "❌ completeStudentWorkout não está disponível em handleExerciseComplete"
          );
        }

        // IMPORTANTE: NÃO chamar completeWorkout aqui porque ele limpa o activeWorkout
        // Vamos chamar depois de mostrar a tela de conclusão
        // completeWorkout(workout.id);

        // Disparar evento de conclusão
        window.dispatchEvent(
          new CustomEvent("workoutCompleted", {
            detail: { workoutId: workout.id },
          })
        );

        // Mostrar tela de conclusão
        setShowCompletion(true);

        // Limpar activeWorkout DEPOIS de salvar os dados
        setTimeout(async () => {
          await completeWorkout(workout.id);
        }, 100);
      }, 0);
    } else {
      console.log("➡️ Avançando para próximo exercício:", {
        currentIndex: activeWorkout.currentExerciseIndex,
        nextIndex: activeWorkout.currentExerciseIndex + 1,
        totalExercises: workout.exercises.length,
        exerciseLogsCount: activeWorkout.exerciseLogs.length,
      });
      if (activeWorkout) {
        const newIndex = activeWorkout.currentExerciseIndex + 1;
        // OTIMISTIC UPDATE: Atualizar Zustand e URL primeiro (instantâneo)
        setCurrentExerciseIndex(newIndex);
        setExerciseIndexParam(newIndex);

        // Salvar progresso em background (não bloquear UI)
        saveWorkoutProgress(workout.id).catch((error) => {
          console.error("Erro ao salvar progresso em background:", error);
        });
      }
    }
  };

  const handleCardioComplete = async () => {
    if (!activeWorkout) return;

    // Pausar cronômetro
    setIsRunning(false);

    // Criar log do exercício de cardio
    const cardioLog: ExerciseLog = {
      id: `cardio-${Date.now()}`,
      workoutId: workout.id,
      exerciseId: currentExercise?.id || "",
      exerciseName: getCurrentExerciseName(),
      sets: [
        {
          setNumber: 1,
          reps: parseInt(currentExercise?.reps || "0"),
          weight: 0,
          completed: true,
        },
      ],
      date: new Date(),
      difficulty: "ideal",
    };

    // Verificar se é o último exercício ANTES de chamar handleExerciseComplete
    const isLastExercise =
      activeWorkout.currentExerciseIndex + 1 >= workout.exercises.length;

    // Se for o último exercício e for cardio, não chamar handleExerciseComplete
    // porque ele já vai chamar setCompletedWorkoutData, e vamos adicionar os dados de cardio depois
    if (isLastExercise) {
      // Adicionar log manualmente ao store
      addExerciseLog(cardioLog);
      console.log(
        "✅ Cardio completado (último):",
        cardioLog.exerciseName,
        "Log ID:",
        cardioLog.id
      );

      // Aguardar um tick para garantir que o estado foi atualizado
      // Usar requestAnimationFrame para garantir que o estado foi atualizado após o addExerciseLog
      requestAnimationFrame(() => {
        setTimeout(async () => {
          const finalState = useWorkoutStore.getState();
          const finalActiveWorkout = finalState.activeWorkout;

          console.log("🔍 Estado do store ANTES de salvar (cardio último):", {
            hasActiveWorkout: !!finalActiveWorkout,
            exerciseLogsCount: finalActiveWorkout?.exerciseLogs?.length || 0,
            exerciseLogs:
              finalActiveWorkout?.exerciseLogs?.map((l) => ({
                name: l.exerciseName,
                id: l.id,
                type:
                  l.exerciseName.toLowerCase().includes("cardio") ||
                  l.exerciseName.toLowerCase().includes("bicicleta") ||
                  l.exerciseName.toLowerCase().includes("corrida") ||
                  l.exerciseName.toLowerCase().includes("pular")
                    ? "CARDIO"
                    : "FORÇA",
              })) || [],
            cardioLogId: cardioLog.id,
          });

          if (finalActiveWorkout) {
            // Garantir que o cardioLog está incluído
            const allLogs = finalActiveWorkout.exerciseLogs || [];
            const logExists = allLogs.some((l) => l.id === cardioLog.id);
            const finalLogs = logExists ? allLogs : [...allLogs, cardioLog];

            console.log(
              "🔍 Estado do store DEPOIS de verificar (cardio último):",
              {
                allLogsCount: allLogs.length,
                logExists,
                finalLogsCount: finalLogs.length,
                finalLogs: finalLogs.map((l) => ({
                  name: l.exerciseName,
                  id: l.id,
                  type:
                    l.exerciseName.toLowerCase().includes("cardio") ||
                    l.exerciseName.toLowerCase().includes("bicicleta") ||
                    l.exerciseName.toLowerCase().includes("corrida") ||
                    l.exerciseName.toLowerCase().includes("pular")
                      ? "CARDIO"
                      : "FORÇA",
                })),
              }
            );

            console.log("📊 Salvando dados de conclusão (cardio - último):", {
              totalLogs: finalLogs.length,
              logs: finalLogs.map((l) => ({
                name: l.exerciseName,
                id: l.id,
                type:
                  l.exerciseName.toLowerCase().includes("cardio") ||
                  l.exerciseName.toLowerCase().includes("bicicleta") ||
                  l.exerciseName.toLowerCase().includes("corrida") ||
                  l.exerciseName.toLowerCase().includes("pular")
                    ? "CARDIO"
                    : "FORÇA",
              })),
              storeLogs: allLogs.length,
              currentLogId: cardioLog.id,
              storeState: {
                exerciseLogsCount: finalActiveWorkout.exerciseLogs?.length || 0,
                exerciseLogs:
                  finalActiveWorkout.exerciseLogs?.map((l) => l.exerciseName) ||
                  [],
              },
            });

            setCompletedWorkoutData({
              exerciseLogs: finalLogs,
              xpEarned: finalActiveWorkout.xpEarned || workout.xpReward,
              totalTime: elapsedTime,
              totalCalories: Math.round(calories),
              avgHeartRate: Math.round(heartRate),
              skippedExercises: finalActiveWorkout.skippedExercises || [],
            });

            // OPTIMISTIC FIRST: Mostrar tela de conclusão IMEDIATAMENTE
            setShowCompletion(true);

            // Disparar eventos IMEDIATAMENTE (optimistic update)
            window.dispatchEvent(
              new CustomEvent("workoutCompleted", {
                detail: { workoutId: workout.id },
              })
            );

            window.dispatchEvent(
              new CustomEvent("workoutProgressUpdate", {
                detail: { workoutId: workout.id, completed: true },
              })
            );

            // Calcular duração do workout
            const workoutDuration = finalActiveWorkout.startTime
              ? Math.round(
                  (new Date().getTime() -
                    new Date(finalActiveWorkout.startTime).getTime()) /
                    60000
                )
              : workout.estimatedTime;

            // Calcular volume total
            const totalVolume = finalActiveWorkout.totalVolume || 0;

            // Determinar feedback baseado em performance
            let overallFeedback: "excelente" | "bom" | "regular" | "ruim" =
              "bom";
            const completedExercises = finalLogs.length;
            const totalExercises = workout.exercises.length;
            const completionRate = completedExercises / totalExercises;

            if (completionRate >= 0.9 && totalVolume > 0) {
              overallFeedback = "excelente";
            } else if (completionRate >= 0.7) {
              overallFeedback = "bom";
            } else if (completionRate >= 0.5) {
              overallFeedback = "regular";
            } else {
              overallFeedback = "ruim";
            }

            // Determinar partes do corpo fatigadas baseado no muscleGroup
            const bodyPartsFatigued = [workout.muscleGroup];

            // Salvar workout no backend (em paralelo, não bloqueia UI)
            const saveWorkoutToBackend = async () => {
              try {
                const { apiClient } = await import("@/lib/api/client");

                // Garantir que startTime seja uma string ISO
                const startTimeValue =
                  finalActiveWorkout.startTime || new Date();
                const startTimeISO =
                  startTimeValue instanceof Date
                    ? startTimeValue.toISOString()
                    : typeof startTimeValue === "string"
                    ? startTimeValue
                    : new Date(startTimeValue).toISOString();

                // Converter exerciseLogs para o formato esperado pela API
                const exerciseLogs = convertExerciseLogsForAPI(finalLogs || []);

                // Garantir que bodyPartsFatigued seja um array válido
                const validBodyPartsFatigued = Array.isArray(bodyPartsFatigued)
                  ? bodyPartsFatigued.filter(
                      (part) => part && typeof part === "string"
                    )
                  : [];

                const requestBody: any = {
                  exerciseLogs: exerciseLogs,
                  duration: workoutDuration,
                  totalVolume: totalVolume || 0,
                  overallFeedback: overallFeedback,
                  xpEarned: finalActiveWorkout.xpEarned || workout.xpReward,
                  startTime: startTimeISO,
                };

                // Adicionar bodyPartsFatigued apenas se não estiver vazio
                if (validBodyPartsFatigued.length > 0) {
                  requestBody.bodyPartsFatigued = validBodyPartsFatigued;
                }

                const response = await apiClient.post(
                  `/api/workouts/${workout.id}/complete`,
                  requestBody
                );
                console.log("Workout salvo com sucesso:", response.data);
              } catch (error: any) {
                console.error(
                  "Erro ao salvar workout no backend:",
                  error?.message || error
                );
              }
            };

            // Atualizar store (em paralelo, não bloqueia UI)
            const updateStore = async () => {
              const xpEarned = finalActiveWorkout.xpEarned || workout.xpReward;
              if (
                completeStudentWorkout &&
                typeof completeStudentWorkout === "function"
              ) {
                try {
                  await completeStudentWorkout({
                    workoutId: workout.id,
                    exercises: finalLogs,
                    duration: workoutDuration,
                    totalVolume: totalVolume,
                    overallFeedback: overallFeedback,
                    bodyPartsFatigued: bodyPartsFatigued,
                    xpEarned: xpEarned,
                  });
                } catch (error) {
                  console.error("Erro ao atualizar store:", error);
                }
              }
            };

            // Executar tudo em paralelo (não bloqueia UI)
            saveWorkoutToBackend();
            updateStore();

            // Limpar activeWorkout após um delay curto
            setTimeout(() => {
              completeWorkout(workout.id);
            }, 100);
          }
        }, 0);
      });
    } else {
      // Se não for o último, usar a função normal
      await handleExerciseComplete(cardioLog);
    }

    // Resetar contadores para o próximo exercício
    setElapsedTime(0);
    setCalories(0);
    setHeartRate(120);
  };

  // Função para finalizar o treino (quando está no último exercício)
  const handleFinish = async () => {
    if (!activeWorkout) return;

    console.log("🏁 handleFinish CHAMADO:", {
      currentIndex: activeWorkout.currentExerciseIndex,
      totalExercises: workout.exercises.length,
      currentExerciseName:
        workout.exercises[activeWorkout.currentExerciseIndex]?.name,
      exerciseLogsCount: activeWorkout.exerciseLogs.length,
      skippedExercisesCount: activeWorkout.skippedExercises?.length || 0,
    });

    // Se for cardio, resetar cronômetro
    if (isCurrentExerciseCardio()) {
      setIsRunning(false);
      setElapsedTime(0);
      setCalories(0);
      setHeartRate(120);
    }

    // Calcular estatísticas atualizadas
    calculateWorkoutStats();

    // Obter estado atualizado
    const currentState = useWorkoutStore.getState();
    const updatedWorkout = currentState.activeWorkout;

    if (!updatedWorkout) {
      console.error("❌ updatedWorkout é null!");
      return;
    }

    const totalExercises = workout.exercises.length;
    const completedCount = updatedWorkout.exerciseLogs.length || 0;
    const skippedCount = updatedWorkout.skippedExercises?.length || 0;
    const totalSeen = completedCount + skippedCount;

    console.log("📊 Estado ao finalizar:", {
      completedCount,
      skippedCount,
      totalSeen,
      totalExercises,
      exerciseLogs: updatedWorkout.exerciseLogs.map((l) => l.exerciseName),
      skippedExercises: updatedWorkout.skippedExercises,
    });

    // Salvar dados para a tela de conclusão ANTES de limpar o activeWorkout
    setCompletedWorkoutData({
      exerciseLogs: updatedWorkout.exerciseLogs || [],
      xpEarned: updatedWorkout.xpEarned || 0,
      skippedExercises: updatedWorkout.skippedExercises || [],
    });

    // OPTIMISTIC FIRST: Mostrar tela de conclusão IMEDIATAMENTE
    setShowCompletion(true);

    // Calcular duração do workout
    const workoutDuration = updatedWorkout?.startTime
      ? Math.round(
          (new Date().getTime() -
            new Date(updatedWorkout.startTime).getTime()) /
            60000
        )
      : workout.estimatedTime;

    // Calcular volume total
    const totalVolume = updatedWorkout?.totalVolume || 0;

    // Determinar feedback baseado em performance
    let overallFeedback: "excelente" | "bom" | "regular" | "ruim" = "regular";
    const completedExercises = updatedWorkout?.exerciseLogs?.length || 0;
    const completionRate = completedExercises / totalExercises;

    if (completionRate >= 0.9 && totalVolume > 0) {
      overallFeedback = "excelente";
    } else if (completionRate >= 0.7) {
      overallFeedback = "bom";
    } else if (completionRate >= 0.5) {
      overallFeedback = "regular";
    } else {
      overallFeedback = "ruim";
    }

    // Determinar partes do corpo fatigadas
    const bodyPartsFatigued = [workout.muscleGroup];

    // Disparar eventos IMEDIATAMENTE (optimistic update)
    window.dispatchEvent(
      new CustomEvent("workoutCompleted", {
        detail: { workoutId: workout.id },
      })
    );

    window.dispatchEvent(
      new CustomEvent("workoutProgressUpdate", {
        detail: { workoutId: workout.id, completed: true },
      })
    );

    // Salvar workout no backend (em paralelo, não bloqueia UI)
    const saveWorkoutToBackend = async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");

        const startTimeValue = updatedWorkout?.startTime || new Date();
        const startTimeISO =
          startTimeValue instanceof Date
            ? startTimeValue.toISOString()
            : typeof startTimeValue === "string"
            ? startTimeValue
            : new Date(startTimeValue).toISOString();

        // Converter exerciseLogs para o formato esperado pela API
        const exerciseLogs = convertExerciseLogsForAPI(
          updatedWorkout?.exerciseLogs || []
        );

        // Garantir que bodyPartsFatigued seja um array válido
        const validBodyPartsFatigued = Array.isArray(bodyPartsFatigued)
          ? bodyPartsFatigued.filter((part) => part && typeof part === "string")
          : [];

        const requestBody = {
          exerciseLogs: exerciseLogs,
          duration: workoutDuration,
          totalVolume: totalVolume || 0,
          overallFeedback: overallFeedback,
          bodyPartsFatigued:
            validBodyPartsFatigued.length > 0
              ? validBodyPartsFatigued
              : undefined,
          xpEarned: updatedWorkout?.xpEarned || 0,
          startTime: startTimeISO,
        };

        // Remover campos undefined para evitar problemas na validação
        Object.keys(requestBody).forEach((key) => {
          if (requestBody[key as keyof typeof requestBody] === undefined) {
            delete requestBody[key as keyof typeof requestBody];
          }
        });

        const response = await apiClient.post(
          `/api/workouts/${workout.id}/complete`,
          requestBody
        );
        console.log("Workout salvo com sucesso:", response.data);
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.error || error?.message || "Erro desconhecido";
        const errorDetails =
          error?.response?.data?.details || error?.response?.data;

        console.error("Erro ao salvar workout no backend:", {
          message: errorMessage,
          status: error?.response?.status,
          details: errorDetails,
          fullError: error,
        });
      }
    };

    // Atualizar store (em paralelo, não bloqueia UI)
    const updateStore = async () => {
      const xpEarned = updatedWorkout.xpEarned || workout.xpReward || 0;
      if (
        completeStudentWorkout &&
        typeof completeStudentWorkout === "function"
      ) {
        try {
          await completeStudentWorkout({
            workoutId: workout.id,
            exercises: updatedWorkout.exerciseLogs || [],
            duration: workoutDuration,
            totalVolume: totalVolume,
            overallFeedback: overallFeedback,
            bodyPartsFatigued: bodyPartsFatigued,
            xpEarned: xpEarned,
          });
        } catch (error) {
          console.error("Erro ao atualizar store:", error);
        }
      }
    };

    // Executar tudo em paralelo (não bloqueia UI)
    saveWorkoutToBackend();
    updateStore();

    // Limpar activeWorkout após um delay curto
    setTimeout(() => {
      completeWorkout(workout.id);
    }, 100);
  };

  const handleSkip = async () => {
    if (!activeWorkout) return;

    console.log("⏭️ handleSkip CHAMADO:", {
      currentIndex: activeWorkout.currentExerciseIndex,
      totalExercises: workout.exercises.length,
      currentExerciseName:
        workout.exercises[activeWorkout.currentExerciseIndex]?.name,
      exerciseLogsCount: activeWorkout.exerciseLogs.length,
      skippedExercisesCount: activeWorkout.skippedExercises?.length || 0,
    });

    // Se for cardio, resetar cronômetro
    if (isCurrentExerciseCardio()) {
      setIsRunning(false);
      setElapsedTime(0);
      setCalories(0);
      setHeartRate(120);
    }

    // Marcar exercício atual como pulado
    const currentExerciseId =
      workout.exercises[activeWorkout.currentExerciseIndex].id;
    skipExercise(currentExerciseId);

    // Calcular estatísticas atualizadas
    calculateWorkoutStats();

    // Obter estado atualizado após pular (Zustand atualiza síncronamente)
    const currentState = useWorkoutStore.getState();
    const updatedWorkout = currentState.activeWorkout;

    if (!updatedWorkout) {
      console.error("❌ updatedWorkout é null após skipExercise!");
      return;
    }

    const totalExercises = workout.exercises.length;
    const completedCount = updatedWorkout.exerciseLogs.length || 0;
    const skippedCount = updatedWorkout.skippedExercises?.length || 0;
    const totalSeen = completedCount + skippedCount;

    console.log("📊 Estado após pular:", {
      completedCount,
      skippedCount,
      totalSeen,
      totalExercises,
      exerciseLogs: updatedWorkout.exerciseLogs.map((l) => l.exerciseName),
      skippedExercises: updatedWorkout.skippedExercises,
    });

    // NÃO salvar progresso aqui - pular é apenas navegação
    // O progresso será salvo apenas quando:
    // - Completar um exercício (adicionar séries/cargas)
    // - Fechar o modal
    // - Finalizar o treino

    // Verificar se chegou no último exercício
    const isLastExercise =
      updatedWorkout.currentExerciseIndex + 1 >= totalExercises;

    console.log("🔍 Verificando conclusão:", {
      isLastExercise,
      totalSeen,
      totalExercises,
      condition: isLastExercise && totalSeen >= totalExercises,
    });

    // Se todos os exercícios foram vistos (completados ou pulados), marcar como completo
    if (isLastExercise && totalSeen >= totalExercises) {
      console.log(
        "✅ Todos os exercícios foram vistos. Salvando dados de conclusão..."
      );
      console.log("📋 Dados que serão salvos:", {
        exerciseLogsCount: updatedWorkout.exerciseLogs.length,
        exerciseLogs: updatedWorkout.exerciseLogs.map((l) => ({
          name: l.exerciseName,
          id: l.id,
        })),
        skippedCount: updatedWorkout.skippedExercises?.length || 0,
        skippedExercises: updatedWorkout.skippedExercises,
        xpEarned: updatedWorkout.xpEarned,
      });

      // Salvar dados para a tela de conclusão ANTES de limpar o activeWorkout
      // IMPORTANTE: Mostrar tela de conclusão sempre, mesmo se todos os exercícios foram pulados
      // Salvar também os exercícios pulados para mostrar no resumo
      setCompletedWorkoutData({
        exerciseLogs: updatedWorkout.exerciseLogs || [],
        xpEarned: updatedWorkout.xpEarned || 0,
        skippedExercises: updatedWorkout.skippedExercises || [],
      });

      // Calcular duração do workout
      const workoutDuration = updatedWorkout?.startTime
        ? Math.round(
            (new Date().getTime() -
              new Date(updatedWorkout.startTime).getTime()) /
              60000
          )
        : workout.estimatedTime;

      // Calcular volume total
      const totalVolume = updatedWorkout?.totalVolume || 0;

      // Determinar feedback baseado em performance
      let overallFeedback: "excelente" | "bom" | "regular" | "ruim" = "regular";
      const completedExercises = updatedWorkout?.exerciseLogs?.length || 0;
      const completionRate = completedExercises / totalExercises;

      if (completionRate >= 0.9 && totalVolume > 0) {
        overallFeedback = "excelente";
      } else if (completionRate >= 0.7) {
        overallFeedback = "bom";
      } else if (completionRate >= 0.5) {
        overallFeedback = "regular";
      } else {
        overallFeedback = "ruim";
      }

      // Determinar partes do corpo fatigadas
      const bodyPartsFatigued = [workout.muscleGroup];

      // IMPORTANTE: Salvar dados ANTES de limpar o activeWorkout
      // Salvar dados para a tela de conclusão
      setCompletedWorkoutData({
        exerciseLogs: updatedWorkout.exerciseLogs || [],
        xpEarned: updatedWorkout.xpEarned || 0,
        skippedExercises: updatedWorkout.skippedExercises || [],
      });

      // OPTIMISTIC FIRST: Mostrar tela de conclusão IMEDIATAMENTE
      setShowCompletion(true);

      // Disparar eventos IMEDIATAMENTE (optimistic update)
      window.dispatchEvent(
        new CustomEvent("workoutCompleted", {
          detail: { workoutId: workout.id },
        })
      );

      window.dispatchEvent(
        new CustomEvent("workoutProgressUpdate", {
          detail: { workoutId: workout.id, completed: true },
        })
      );

      // Salvar workout no backend (em paralelo, não bloqueia UI)
      const saveWorkoutToBackend = async () => {
        try {
          // Usar axios client (API → Zustand → Component)
          const { apiClient } = await import("@/lib/api/client");

          // Converter startTime para ISO string se for Date object
          const startTimeValue = updatedWorkout?.startTime || new Date();
          const startTimeISO =
            startTimeValue instanceof Date
              ? startTimeValue.toISOString()
              : typeof startTimeValue === "string"
              ? startTimeValue
              : new Date(startTimeValue).toISOString();

          // Converter exerciseLogs para o formato esperado pela API
          const exerciseLogs = convertExerciseLogsForAPI(
            updatedWorkout?.exerciseLogs || []
          );

          // Garantir que bodyPartsFatigued seja um array válido
          const validBodyPartsFatigued = Array.isArray(bodyPartsFatigued)
            ? bodyPartsFatigued.filter(
                (part) => part && typeof part === "string"
              )
            : [];

          const requestBody: any = {
            exerciseLogs: exerciseLogs,
            duration: workoutDuration,
            totalVolume: totalVolume || 0,
            overallFeedback: overallFeedback,
            xpEarned: updatedWorkout?.xpEarned || 0,
            startTime: startTimeISO,
          };

          // Adicionar bodyPartsFatigued apenas se não estiver vazio
          if (validBodyPartsFatigued.length > 0) {
            requestBody.bodyPartsFatigued = validBodyPartsFatigued;
          }

          const response = await apiClient.post(
            `/api/workouts/${workout.id}/complete`,
            requestBody
          );
          console.log("Workout salvo com sucesso:", response.data);
        } catch (error: any) {
          // Log detalhado do erro para debug
          const errorMessage =
            error?.response?.data?.error ||
            error?.message ||
            "Erro desconhecido";
          const errorDetails =
            error?.response?.data?.details || error?.response?.data;

          console.error("Erro ao salvar workout no backend:", {
            message: errorMessage,
            status: error?.response?.status,
            details: errorDetails,
            fullError: error,
          });
        }
      };

      // Atualizar store (em paralelo, não bloqueia UI)
      const updateStore = async () => {
        const xpEarned = updatedWorkout.xpEarned || workout.xpReward || 0;
        if (
          completeStudentWorkout &&
          typeof completeStudentWorkout === "function"
        ) {
          try {
            await completeStudentWorkout({
              workoutId: workout.id,
              exercises: updatedWorkout.exerciseLogs || [],
              duration: workoutDuration,
              totalVolume: totalVolume,
              overallFeedback: overallFeedback,
              bodyPartsFatigued: bodyPartsFatigued,
              xpEarned: xpEarned,
            });
          } catch (error) {
            console.error("Erro ao atualizar store:", error);
          }
        }
      };

      // Executar tudo em paralelo (não bloqueia UI)
      saveWorkoutToBackend();
      updateStore();

      // Limpar activeWorkout após um delay curto
      setTimeout(() => {
        completeWorkout(workout.id);
      }, 100);
    } else if (isLastExercise) {
      // Se chegou no último mas ainda não completou todos, mostrar conclusão mesmo assim
      setShowCompletion(true);
    } else {
      // Avançar para próximo exercício (apenas navegação)
      const newIndex = updatedWorkout.currentExerciseIndex + 1;
      // OTIMISTIC UPDATE: Atualizar Zustand e URL primeiro (instantâneo)
      setCurrentExerciseIndex(newIndex);
      setExerciseIndexParam(newIndex);
      // NÃO salvar progresso aqui - já foi salvo acima quando pulou o exercício
      // O avanço é apenas navegação, não há mudança de estado adicional
    }
  };

  const handleClose = async () => {
    // Se está na tela de config de cardio e o usuário fechar sem escolher
    // Não salvar progresso para que a tela apareça novamente
    if (cardioConfigModal.isOpen) {
      workoutModal.close();
      cardioConfigModal.close();
      setActiveWorkout(null);
      // Limpar exerciseIndex da URL
      setExerciseIndexParam(null);
      return;
    }

    // Salvar progresso em background antes de fechar (não bloquear fechamento)
    if (workout && activeWorkout) {
      saveWorkoutProgress(workout.id).catch((error) => {
        console.error("Erro ao salvar progresso em background:", error);
      });
    }
    // Fechar modal
    workoutModal.close();
    setShowCompletion(false);
    weightTrackerModal.close();
    // Limpar exerciseIndex da URL
    setExerciseIndexParam(null);
  };

  // Verificar se deve mostrar tela de conclusão
  if (showCompletion) {
    // Usar dados salvos ou dados do activeWorkout (se ainda existir)
    const workoutData = completedWorkoutData || {
      exerciseLogs: activeWorkout?.exerciseLogs || [],
      xpEarned: activeWorkout?.xpEarned || 0,
      skippedExercises: activeWorkout?.skippedExercises || [],
    };

    // Calcular volume total apenas de séries válidas (peso > 0 e reps > 0)
    const totalVolume = workoutData.exerciseLogs.reduce(
      (acc, log) =>
        acc +
        log.sets
          .filter((set) => set.weight > 0 && set.reps > 0)
          .reduce((setAcc, set) => setAcc + set.weight * set.reps, 0),
      0
    );

    return (
      <WorkoutCompletionView
        workout={workout}
        workoutData={workoutData}
        totalVolume={totalVolume}
        onClose={handleClose}
        onRepeat={() => {
          if (!workout) return;
          clearWorkoutProgress(workout.id);
          setActiveWorkout(workout);
          setShowCompletion(false);
          setCompletedWorkoutData(null);
        }}
      />
    );
  }

  // Se não está mostrando conclusão, precisa ter activeWorkout e currentExercise
  if (!activeWorkout || !currentExercise) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {openWorkoutId && (
        <motion.div
          key={openWorkoutId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex h-screen flex-col bg-white overflow-hidden"
        >
          {/* Weight Tracker Modal Overlay (sub-modal dentro do workout) */}
          {currentExercise && (
            <WeightTrackerOverlay
              isOpen={weightTrackerModal.isOpen}
              onClose={weightTrackerModal.close}
              exerciseName={getCurrentExerciseName()}
              exercise={currentExercise}
              progress={workoutProgress}
              currentExercise={
                activeWorkout?.currentExerciseIndex !== undefined
                  ? activeWorkout.currentExerciseIndex + 1
                  : 0
              }
              totalExercises={workout.exercises.length}
              exerciseIds={workout.exercises.map((ex) => ex.id)}
              completedExerciseIds={
                activeWorkout?.exerciseLogs?.map((log) => log.exerciseId) || []
              }
              skippedExerciseIds={activeWorkout?.skippedExercises || []}
              currentExerciseId={currentExercise?.id}
              onComplete={handleExerciseComplete}
              onSaveProgress={handleSaveProgress}
              existingLog={getCurrentExerciseLog()}
              isUnilateral={isCurrentExerciseUnilateral()}
            />
          )}

          {/* Cardio Config Modal Overlay (sub-modal dentro do workout) */}
          <CardioConfigModal
            isOpen={cardioConfigModal.isOpen && !!workout && !!activeWorkout}
            onClose={cardioConfigModal.close}
            onSelectPreference={setCardioPreference}
          />

          {/* Header Estilo Duolingo */}
          <WorkoutHeader
            onClose={handleClose}
            hearts={hearts}
            currentExercise={
              activeWorkout?.currentExerciseIndex !== undefined
                ? activeWorkout.currentExerciseIndex + 1
                : 0
            }
            totalExercises={workout.exercises.length}
            progress={workoutProgress}
            exerciseIds={workout.exercises.map((ex) => ex.id)}
            completedExerciseIds={
              activeWorkout?.exerciseLogs?.map((log) => log.exerciseId) || []
            }
            skippedExerciseIds={activeWorkout?.skippedExercises || []}
          />

          {/* Exercise Content */}
          {activeWorkout && currentExercise && (
            <>
              <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center justify-center p-4 sm:p-6 min-h-0">
                <div className="w-full max-w-2xl">
                  {/* Exercise Card Estilo Duolingo */}
                  <AnimatePresence mode="wait">
                    <ExerciseCardView
                      key={activeWorkout.currentExerciseIndex}
                      exercise={currentExercise}
                      exerciseName={getCurrentExerciseName()}
                      hasAlternative={
                        !!activeWorkout?.selectedAlternatives?.[
                          currentExercise.id
                        ]
                      }
                      isCardio={!!isCurrentExerciseCardio()}
                      elapsedTime={elapsedTime}
                      xpPerExercise={Math.round(
                        workout.xpReward / workout.exercises.length
                      )}
                      onViewEducation={handleViewEducation}
                      isCompleted={!!getCurrentExerciseLog()}
                      completedSetsCount={
                        getCurrentExerciseLog()?.sets?.length || 0
                      }
                    />
                  </AnimatePresence>
                </div>
              </div>

              {/* Botões fixos na parte inferior */}
              <WorkoutFooter
                isCardio={!!isCurrentExerciseCardio()}
                isRunning={isRunning}
                currentExercise={currentExercise}
                canGoBack={
                  !!(activeWorkout && activeWorkout.currentExerciseIndex > 0)
                }
                isLastExercise={
                  !!(
                    activeWorkout &&
                    activeWorkout.currentExerciseIndex + 1 >=
                      workout.exercises.length
                  )
                }
                onToggleCardio={() => setIsRunning(!isRunning)}
                onOpenWeightTracker={weightTrackerModal.open}
                onOpenAlternatives={() => {
                  console.log("👆 Clicou em VER ALTERNATIVAS");
                  console.log("currentExercise:", currentExercise);
                  alternativeSelectorModal.open();
                }}
                onCompleteCardio={handleCardioComplete}
                onGoBack={() => {
                  if (activeWorkout) {
                    const newIndex = activeWorkout.currentExerciseIndex - 1;
                    // Apenas navegação - não salvar progresso (não há mudança de estado)
                    setCurrentExerciseIndex(newIndex);
                    setExerciseIndexParam(newIndex);
                    // NÃO salvar progresso aqui - é apenas navegação
                  }
                }}
                onFinish={handleFinish}
                onSkip={handleSkip}
              />
            </>
          )}

          {/* Alternative Selector Modal */}
          <AnimatePresence>
            {alternativeSelectorModal.isOpen && currentExercise && (
              <ExerciseAlternativeSelector
                exercise={currentExercise}
                onSelect={handleSelectAlternative}
                onCancel={alternativeSelectorModal.close}
                onViewEducation={handleViewEducation}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
