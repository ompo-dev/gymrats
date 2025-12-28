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
  Flame,
  Activity,
  Play,
  Pause,
} from "lucide-react";
import { Progress } from "@/components/atoms/progress/progress";
import { Button } from "@/components/atoms/buttons/button";
import { WeightTracker } from "../trackers/weight-tracker";
import { ExerciseAlternativeSelector } from "../modals/exercise-alternative-selector";
import { CardioExerciseView } from "./workout/cardio-exercise-view";
import { StrengthExerciseView } from "./workout/strength-exercise-view";
import type {
  ExerciseLog,
  WorkoutExercise,
  WorkoutSession,
  AlternativeExercise,
  Unit,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { FadeIn } from "@/components/animations/fade-in";
import { useWorkoutStore, useUIStore } from "@/stores";
import { useStudent } from "@/hooks/use-student";
import { useRouter } from "next/navigation";
import {
  useModalState,
  useModalStateWithParam,
  useSubModalState,
} from "@/hooks/use-modal-state";
import { parseAsInteger, useQueryState } from "nuqs";

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

  const handleExerciseComplete = async (log: ExerciseLog) => {
    console.log("🚀 handleExerciseComplete CHAMADO:", {
      exerciseName: log.exerciseName,
      logId: log.id,
      currentIndex: activeWorkout?.currentExerciseIndex,
      totalExercises: workout?.exercises.length,
    });

    // Adicionar log do exercício
    addExerciseLog(log);
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

            // Garantir que exerciseLogs seja um array válido
            const exerciseLogs = (finalLogs || []).filter(
              (log) => log && log.exerciseId && log.exerciseName
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

            // Salvar workout no backend
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

                // Garantir que exerciseLogs seja um array válido
                const exerciseLogs = (finalLogs || []).filter(
                  (log) => log && log.exerciseId && log.exerciseName
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

            saveWorkoutToBackend();

            // Marcar como completo
            const xpEarned = finalActiveWorkout.xpEarned || workout.xpReward;
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
                xpEarned: xpEarned,
              });
            } else {
              console.error(
                "❌ completeStudentWorkout não está disponível em handleCardioComplete"
              );
            }

            // IMPORTANTE: NÃO chamar completeWorkout aqui porque ele limpa o activeWorkout
            // Vamos chamar depois de mostrar a tela de conclusão
            // completeWorkout(workout.id);

            window.dispatchEvent(
              new CustomEvent("workoutCompleted", {
                detail: { workoutId: workout.id },
              })
            );

            setShowCompletion(true);

            // Limpar activeWorkout DEPOIS de salvar os dados
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

    // Salvar workout no backend
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

        // Garantir que exerciseLogs seja um array válido
        const exerciseLogs = (updatedWorkout?.exerciseLogs || []).filter(
          (log) => log && log.exerciseId && log.exerciseName
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

    // Salvar no backend (não bloquear UI)
    saveWorkoutToBackend();

    // Marcar como completo
    const xpEarned = updatedWorkout.xpEarned || workout.xpReward || 0;
    if (
      completeStudentWorkout &&
      typeof completeStudentWorkout === "function"
    ) {
      await completeStudentWorkout({
        workoutId: workout.id,
        exercises: updatedWorkout.exerciseLogs || [],
        duration: workoutDuration,
        totalVolume: totalVolume,
        overallFeedback: overallFeedback,
        bodyPartsFatigued: bodyPartsFatigued,
        xpEarned: xpEarned,
      });
    } else {
      console.error(
        "❌ completeStudentWorkout não está disponível em handleFinish"
      );
    }

    // XP já é atualizado automaticamente pelo backend quando o workout é completado
    // Não precisamos chamar addXP manualmente

    // Disparar evento de conclusão
    window.dispatchEvent(
      new CustomEvent("workoutCompleted", {
        detail: { workoutId: workout.id },
      })
    );

    // Disparar evento customizado para atualizar o estado de completed workouts no store
    window.dispatchEvent(
      new CustomEvent("workoutProgressUpdate", {
        detail: { workoutId: workout.id, completed: true },
      })
    );

    // Mostrar tela de conclusão
    setShowCompletion(true);

    // Limpar activeWorkout DEPOIS de salvar os dados
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

    // Salvar progresso em background (não bloquear UI)
    saveWorkoutProgress(workout.id).catch((error) => {
      console.error("Erro ao salvar progresso em background:", error);
    });

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

      // Salvar workout no backend
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

          // Garantir que exerciseLogs seja um array válido
          const exerciseLogs = (updatedWorkout?.exerciseLogs || []).filter(
            (log) => log && log.exerciseId && log.exerciseName
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

      // Salvar no backend (não bloquear UI)
      saveWorkoutToBackend();

      // IMPORTANTE: Salvar dados ANTES de limpar o activeWorkout
      // Salvar dados para a tela de conclusão
      setCompletedWorkoutData({
        exerciseLogs: updatedWorkout.exerciseLogs || [],
        xpEarned: updatedWorkout.xpEarned || 0,
        skippedExercises: updatedWorkout.skippedExercises || [],
      });

      // IMPORTANTE: Atualizar Zustand ANTES de disparar eventos (estado otimista)
      // Isso garante que o próximo workout seja desbloqueado imediatamente
      // Mas NÃO limpar o activeWorkout ainda - vamos fazer depois
      // completeWorkout(workout.id);
      console.log("🔄 Chamando completeStudentWorkout com:", {
        workoutId: workout.id,
        exercisesCount: updatedWorkout.exerciseLogs.length,
        exercises: updatedWorkout.exerciseLogs.map((l) => l.exerciseName),
        duration: 0,
      });
      // Calcular XP ganho (usar xpEarned do workout atualizado ou do workout original)
      const xpEarned = updatedWorkout.xpEarned || workout.xpReward || 0;
      // completeStudentWorkout já chama loadProgress internamente
      if (
        completeStudentWorkout &&
        typeof completeStudentWorkout === "function"
      ) {
        await completeStudentWorkout({
          workoutId: workout.id,
          exercises: updatedWorkout.exerciseLogs || [],
          duration: 0,
          xpEarned: xpEarned, // Passar xpEarned para atualizar progresso
        });
      } else {
        console.error(
          "❌ completeStudentWorkout não está disponível em handleSkip"
        );
      }

      // XP já é atualizado automaticamente pelo backend quando o workout é completado
      // Não precisamos chamar addXP manualmente

      // Disparar evento de conclusão IMEDIATAMENTE após atualizar o store
      // Isso garante que os WorkoutNodes sejam atualizados na hora
      window.dispatchEvent(
        new CustomEvent("workoutCompleted", {
          detail: { workoutId: workout.id },
        })
      );

      // Disparar evento customizado para atualizar o estado de completed workouts no store
      window.dispatchEvent(
        new CustomEvent("workoutProgressUpdate", {
          detail: { workoutId: workout.id, completed: true },
        })
      );

      setShowCompletion(true);

      // Limpar activeWorkout DEPOIS de salvar os dados
      setTimeout(() => {
        completeWorkout(workout.id);
      }, 100);
    } else if (isLastExercise) {
      // Se chegou no último mas ainda não completou todos, mostrar conclusão mesmo assim
      setShowCompletion(true);
    } else {
      // Avançar para próximo exercício
      const newIndex = updatedWorkout.currentExerciseIndex + 1;
      // OTIMISTIC UPDATE: Atualizar Zustand e URL primeiro (instantâneo)
      setCurrentExerciseIndex(newIndex);
      setExerciseIndexParam(newIndex);

      // Salvar progresso em background (não bloquear UI)
      saveWorkoutProgress(workout.id).catch((error) => {
        console.error("Erro ao salvar progresso em background:", error);
      });
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

    // Criar lista combinada de exercícios completados e pulados
    const completedExerciseIds = new Set(
      workoutData.exerciseLogs.map((log) => log.exerciseId)
    );
    const skippedExerciseIds = new Set(
      workoutData.skippedExercises || activeWorkout?.skippedExercises || []
    );

    // Criar lista de todos os exercícios do workout com status
    const allExercises = workout.exercises.map((exercise) => {
      const isCompleted = completedExerciseIds.has(exercise.id);
      const isSkipped = skippedExerciseIds.has(exercise.id);
      const exerciseLog = workoutData.exerciseLogs.find(
        (log) => log.exerciseId === exercise.id
      );

      return {
        id: exercise.id,
        name: exercise.name,
        isCompleted,
        isSkipped,
        exerciseLog, // null se foi pulado
      };
    });

    // Debug: Verificar dados que serão exibidos
    console.log("🎯 Dados para tela de conclusão:", {
      hasCompletedWorkoutData: !!completedWorkoutData,
      totalLogs: workoutData.exerciseLogs.length,
      skippedCount: skippedExerciseIds.size,
      totalExercises: allExercises.length,
      logs: workoutData.exerciseLogs.map((l) => ({
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
      activeWorkoutLogs: activeWorkout?.exerciseLogs?.length || 0,
    });

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
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-screen w-full max-h-screen flex-col items-center overflow-y-auto bg-linear-to-b from-white to-gray-50 p-4 sm:p-6"
          >
            <FadeIn delay={0.1}>
              <div className="mb-4 sm:mb-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 10,
                    delay: 0.2,
                  }}
                  className="mb-4 sm:mb-6 text-6xl sm:text-8xl"
                >
                  🎉
                </motion.div>
                <h1 className="mb-2 text-2xl sm:text-3xl lg:text-4xl font-black text-[#58CC02]">
                  Treino Completo!
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-duo-gray-dark">
                  Excelente trabalho hoje!
                </p>
              </div>
            </FadeIn>

            <div className="mb-4 sm:mb-8 grid w-full max-w-md grid-cols-2 gap-3 sm:gap-4">
              {/* Se houver dados de cardio, mostrar métricas diferentes */}
              {workoutData.totalTime !== undefined ? (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    className="rounded-2xl border-2 border-duo-blue bg-duo-blue/20 p-4 sm:p-6 text-center shadow-lg"
                  >
                    <Timer className="mx-auto mb-2 h-5 w-5 sm:h-6 sm:w-6 text-duo-blue" />
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                      Tempo Total
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-duo-blue">
                      {formatTime(workoutData.totalTime)}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    className="rounded-2xl border-2 border-duo-orange bg-duo-orange/20 p-4 sm:p-6 text-center shadow-lg"
                  >
                    <Flame className="mx-auto mb-2 h-5 w-5 sm:h-6 sm:w-6 text-duo-orange" />
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                      Calorias
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-duo-orange">
                      {workoutData.totalCalories}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    className="rounded-2xl border-2 border-duo-red bg-duo-red/20 p-4 sm:p-6 text-center shadow-lg"
                  >
                    <Heart className="mx-auto mb-2 h-5 w-5 sm:h-6 sm:w-6 text-duo-red" />
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                      FC Média
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-duo-red">
                      {workoutData.avgHeartRate} bpm
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    className="rounded-2xl border-2 border-[#FFC800] bg-linear-to-br from-[#FFC800]/20 to-[#FF9600]/20 p-4 sm:p-6 text-center shadow-lg"
                  >
                    <Zap className="mx-auto mb-2 h-5 w-5 sm:h-6 sm:w-6 text-[#FFC800]" />
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                      XP Ganho
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#FFC800]">
                      {workout.xpReward}
                    </div>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    className="rounded-2xl border-2 border-[#FFC800] bg-linear-to-br from-[#FFC800]/20 to-[#FF9600]/20 p-4 sm:p-6 text-center shadow-lg"
                  >
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-[#FFC800]" />
                    </div>
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                      XP Ganho
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#FFC800]">
                      {workout.xpReward}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    className="rounded-2xl border-2 border-[#1CB0F6] bg-linear-to-br from-[#1CB0F6]/20 to-[#58CC02]/20 p-4 sm:p-6 text-center shadow-lg"
                  >
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <Weight className="h-5 w-5 sm:h-6 sm:w-6 text-[#1CB0F6]" />
                    </div>
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                      Volume Total
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#1CB0F6]">
                      {totalVolume.toFixed(0)}kg
                    </div>
                  </motion.div>
                </>
              )}
            </div>

            {/* Mostrar resumo com todos os exercícios (completados e pulados) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="mb-4 sm:mb-6 w-full max-w-md space-y-2 sm:space-y-3"
            >
              <h3 className="text-base sm:text-lg font-bold text-duo-text">
                Resumo do Treino ({allExercises.length} exercícios)
              </h3>
              {allExercises.map((exercise, index) => {
                const isCompleted = exercise.isCompleted;
                const isSkipped = exercise.isSkipped;
                const log = exercise.exerciseLog;

                return (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className={cn(
                      "rounded-xl border-2 p-3 sm:p-4 shadow-sm transition-all hover:shadow-md",
                      isCompleted
                        ? "border-duo-green bg-white"
                        : isSkipped
                        ? "border-duo-orange bg-white opacity-75"
                        : "border-duo-border bg-white"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="font-bold text-duo-text text-sm sm:text-base wrap-break-words flex-1">
                        {exercise.name}
                      </div>
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 fill-[#58CC02] text-white shrink-0" />
                      ) : isSkipped ? (
                        <X className="h-4 w-4 sm:h-5 sm:w-5 text-duo-orange shrink-0" />
                      ) : null}
                    </div>
                    {isCompleted && log ? (
                      <div className="text-xs sm:text-sm text-duo-gray-dark">
                        {
                          log.sets.filter(
                            (set) => set.weight > 0 && set.reps > 0
                          ).length
                        }{" "}
                        séries •{" "}
                        {log.sets
                          .filter((set) => set.weight > 0 && set.reps > 0)
                          .reduce((acc, set) => acc + set.weight * set.reps, 0)
                          .toFixed(0)}
                        kg volume
                      </div>
                    ) : isSkipped ? (
                      <div className="text-xs sm:text-sm text-duo-orange font-medium">
                        Exercício pulado
                      </div>
                    ) : null}
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="flex w-full max-w-md gap-2 sm:gap-3 mb-4 sm:mb-0"
            >
              <Button
                variant="white"
                className="flex-1 text-sm sm:text-base"
                onClick={() => {
                  if (!workout) return;

                  // Limpar progresso salvo para começar do zero
                  clearWorkoutProgress(workout.id);

                  // Reinicializar workout do zero
                  setActiveWorkout(workout);

                  // Resetar tela de conclusão
                  setShowCompletion(false);
                  setCompletedWorkoutData(null);
                }}
              >
                <span className="hidden sm:inline">FAZER NOVAMENTE</span>
                <span className="sm:hidden">REFAZER</span>
              </Button>
              <Button
                variant="default"
                className="flex-1 text-sm sm:text-base"
                onClick={handleClose}
              >
                CONTINUAR
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
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
          {weightTrackerModal.isOpen && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 z-60 flex h-screen flex-col bg-white overflow-hidden"
              >
                <div className="border-b-2 border-duo-border bg-white p-4 shadow-sm shrink-0">
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      onClick={weightTrackerModal.close}
                      className="rounded-xl p-2 transition-colors hover:bg-gray-100"
                    >
                      <X className="h-6 w-6 text-duo-gray-dark" />
                    </button>
                    <div className="text-sm font-bold text-duo-gray-dark">
                      Exercício{" "}
                      {activeWorkout?.currentExerciseIndex !== undefined
                        ? activeWorkout.currentExerciseIndex + 1
                        : 0}
                      /{workout.exercises.length}
                    </div>
                    <div className="w-6" />
                  </div>
                  <Progress
                    key={`progress-weight-${workoutProgress}-${currentIndex}-${
                      activeWorkout?.exerciseLogs?.length || 0
                    }-${activeWorkout?.skippedExercises?.length || 0}`}
                    value={workoutProgress}
                    className="h-3"
                  />
                </div>

                {currentExercise && (
                  <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
                    <WeightTracker
                      exerciseName={getCurrentExerciseName()}
                      exerciseId={currentExercise.id}
                      defaultSets={currentExercise.sets}
                      defaultReps={currentExercise.reps}
                      onComplete={handleExerciseComplete}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Cardio Config Modal Overlay (sub-modal dentro do workout) */}
          {cardioConfigModal.isOpen && workout && activeWorkout && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    cardioConfigModal.close();
                  }
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-md mx-4 rounded-3xl border-2 border-duo-border bg-white p-6 sm:p-8 shadow-2xl"
                >
                  <button
                    onClick={cardioConfigModal.close}
                    className="absolute right-4 top-4 rounded-xl p-2 transition-colors hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 text-duo-gray-dark" />
                  </button>

                  <div className="mb-6 text-center">
                    <div className="mb-4 text-6xl">🏃‍♂️</div>
                    <h2 className="mb-2 text-2xl font-black text-duo-text">
                      Adicionar Cardio?
                    </h2>
                    <p className="text-sm text-duo-gray-dark">
                      Escolha quando fazer cardio hoje
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Não fazer cardio */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setCardioPreference("none", undefined);
                        cardioConfigModal.close();
                      }}
                      className="w-full rounded-2xl border-2 border-duo-border bg-white p-4 text-left transition-all hover:border-duo-gray hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">❌</div>
                        <div className="flex-1">
                          <div className="font-bold text-duo-text">
                            Não Fazer Cardio
                          </div>
                          <div className="text-sm text-duo-gray-dark">
                            Apenas treino de força hoje
                          </div>
                        </div>
                      </div>
                    </motion.button>

                    {/* Cardio ANTES */}
                    <div className="space-y-2">
                      <div className="text-sm font-bold text-duo-text">
                        ⏱️ Cardio ANTES do Treino
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 15, 20].map((duration) => (
                          <motion.button
                            key={`before-${duration}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setCardioPreference("before", duration);
                              cardioConfigModal.close();
                            }}
                            className="rounded-xl border-2 border-duo-blue bg-duo-blue/10 p-3 text-center transition-all hover:bg-duo-blue/20"
                          >
                            <div className="text-xl font-black text-duo-blue">
                              {duration}
                            </div>
                            <div className="text-xs text-duo-gray-dark">
                              min
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Cardio DEPOIS */}
                    <div className="space-y-2">
                      <div className="text-sm font-bold text-duo-text">
                        ⏱️ Cardio DEPOIS do Treino
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 15, 20].map((duration) => (
                          <motion.button
                            key={`after-${duration}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setCardioPreference("after", duration);
                              cardioConfigModal.close();
                            }}
                            className="rounded-xl border-2 border-duo-orange bg-duo-orange/10 p-3 text-center transition-all hover:bg-duo-orange/20"
                          >
                            <div className="text-xl font-black text-duo-orange">
                              {duration}
                            </div>
                            <div className="text-xs text-duo-gray-dark">
                              min
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Header Estilo Duolingo */}
          <div className="border-b-2 border-duo-border bg-white p-3 sm:p-4 shadow-sm shrink-0">
            <div className="mb-2 sm:mb-3 flex items-center justify-between">
              <button
                onClick={handleClose}
                className="rounded-xl p-2 transition-colors hover:bg-gray-100 active:scale-95"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-duo-gray-dark" />
              </button>
              <div className="flex items-center gap-1 sm:gap-2">
                {Array.from({ length: hearts }).map((_, i) => (
                  <Heart
                    key={i}
                    className="h-5 w-5 sm:h-6 sm:w-6 fill-duo-red text-duo-red"
                  />
                ))}
              </div>
            </div>
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-duo-gray-dark">
              <div className="flex items-center gap-2">
                <span>
                  Exercício{" "}
                  {activeWorkout?.currentExerciseIndex !== undefined
                    ? activeWorkout.currentExerciseIndex + 1
                    : 0}{" "}
                  de {workout.exercises.length}
                </span>
              </div>
              <span>{Math.round(workoutProgress)}%</span>
            </div>
            <Progress
              key={`progress-main-${workoutProgress}-${
                activeWorkout?.exerciseLogs?.length || 0
              }`}
              value={workoutProgress}
              className="h-2 sm:h-3"
            />
          </div>

          {/* Exercise Content */}
          {activeWorkout && currentExercise && (
            <>
              <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center justify-center p-4 sm:p-6 min-h-0">
                <div className="w-full max-w-2xl">
                  {/* Exercise Card Estilo Duolingo */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeWorkout.currentExerciseIndex}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="mb-4 sm:mb-8 rounded-2xl sm:rounded-3xl border-2 border-duo-border bg-linear-to-br from-white to-gray-50 p-4 sm:p-6 lg:p-8 shadow-lg"
                    >
                      <div className="mb-4 sm:mb-6">
                        <h1 className="text-center text-xl sm:text-2xl lg:text-3xl font-black text-duo-text wrap-break-words">
                          {getCurrentExerciseName()}
                        </h1>
                        {activeWorkout?.selectedAlternatives?.[
                          currentExercise.id
                        ] && (
                          <p className="mt-2 text-center text-sm text-duo-blue font-bold">
                            ✓ Alternativa selecionada
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        {isCurrentExerciseCardio() ? (
                          <>
                            {/* Cronômetro Principal - CARDIO */}
                            <div className="rounded-xl sm:rounded-2xl border-2 border-duo-red bg-linear-to-br from-duo-red/10 to-duo-red/5 p-6 sm:p-8 text-center">
                              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                                Tempo
                              </div>
                              <div className="text-5xl sm:text-6xl font-black text-duo-red">
                                {formatTime(elapsedTime)}
                              </div>
                              <div className="mt-3 text-sm text-duo-gray-dark">
                                Meta: {currentExercise.reps}
                              </div>
                            </div>

                            {/* Métricas em Tempo Real - CARDIO */}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                              <div className="rounded-xl border-2 border-duo-orange bg-linear-to-br from-duo-orange/10 to-white p-3 sm:p-4 text-center">
                                <Flame className="mx-auto mb-1 h-5 w-5 text-duo-orange" />
                                <div className="text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                                  Calorias
                                </div>
                                <div className="text-2xl font-black text-duo-orange">
                                  {Math.round(calories)}
                                </div>
                              </div>
                              <div className="rounded-xl border-2 border-duo-red bg-linear-to-br from-duo-red/10 to-white p-3 sm:p-4 text-center">
                                <Activity className="mx-auto mb-1 h-5 w-5 text-duo-red" />
                                <div className="text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                                  FC
                                </div>
                                <div className="text-2xl font-black text-duo-red">
                                  {Math.round(heartRate)} bpm
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Séries e Repetições - FORÇA */}
                            <div className="rounded-xl sm:rounded-2xl border-2 border-[#58CC02] bg-linear-to-br from-[#58CC02]/10 to-[#47A302]/10 p-4 sm:p-6 text-center">
                              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                                Séries e Repetições
                              </div>
                              <div className="text-3xl sm:text-4xl font-black text-[#58CC02]">
                                {currentExercise.sets} x {currentExercise.reps}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                              <div className="rounded-xl border-2 border-duo-blue bg-linear-to-br from-duo-blue/10 to-white p-3 sm:p-4 text-center">
                                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                                  Descanso
                                </div>
                                <div className="text-xl sm:text-2xl font-black text-duo-blue">
                                  {currentExercise.rest}s
                                </div>
                              </div>
                              <div className="rounded-xl border-2 border-duo-orange bg-linear-to-br from-duo-orange/10 to-white p-3 sm:p-4 text-center">
                                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-duo-gray-dark">
                                  XP
                                </div>
                                <div className="text-xl sm:text-2xl font-black text-duo-orange">
                                  +
                                  {Math.round(
                                    workout.xpReward / workout.exercises.length
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {currentExercise.notes && (
                          <div className="rounded-xl border-2 border-duo-blue bg-linear-to-br from-duo-blue/10 to-white p-3 sm:p-4">
                            <div className="mb-1 flex items-center gap-2 text-xs sm:text-sm font-bold text-duo-blue">
                              <span>💡</span>
                              <span>Dica</span>
                            </div>
                            <p className="text-xs sm:text-sm text-duo-text wrap-break-words">
                              {currentExercise.notes}
                            </p>
                          </div>
                        )}

                        {/* Link para conteúdo educacional */}
                        {currentExercise.educationalId && (
                          <button
                            onClick={() => {
                              if (currentExercise.educationalId) {
                                handleViewEducation(
                                  currentExercise.educationalId
                                );
                              }
                            }}
                            className="w-full rounded-xl border-2 border-duo-green/30 bg-duo-green/5 p-3 text-left transition-all hover:border-duo-green/50 hover:bg-duo-green/10"
                          >
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5 shrink-0 text-duo-green" />
                              <div className="flex-1">
                                <div className="text-xs sm:text-sm font-bold text-duo-green">
                                  Ver técnica detalhada
                                </div>
                                <div className="text-xs text-duo-gray-dark">
                                  Instruções completas, dicas e erros comuns
                                </div>
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Botões fixos na parte inferior */}
              <div className="border-t-2 border-duo-border bg-white p-3 sm:p-4 shadow-lg shrink-0">
                <div className="mx-auto max-w-2xl">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="space-y-2 sm:space-y-3"
                  >
                    {isCurrentExerciseCardio() ? (
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsRunning(!isRunning)}
                        className={cn(
                          "w-full rounded-xl sm:rounded-2xl py-3 sm:py-4 font-bold text-white transition-all flex items-center justify-center gap-2",
                          isRunning
                            ? "bg-duo-orange hover:bg-duo-orange/90"
                            : "bg-duo-green hover:bg-duo-green/90"
                        )}
                      >
                        {isRunning ? (
                          <>
                            <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>PAUSAR</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>INICIAR</span>
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={weightTrackerModal.open}
                        className="duo-button-green w-full flex items-center justify-center gap-2 text-sm sm:text-base lg:text-lg py-3 sm:py-4"
                      >
                        <Weight className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">
                          REGISTRAR SÉRIES E CARGAS
                        </span>
                        <span className="sm:hidden">SÉRIES E CARGAS</span>
                      </motion.button>
                    )}

                    {/* Botão de alternativas - VERSÃO ATUALIZADA */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        console.log("👆 Clicou em VER ALTERNATIVAS");
                        console.log("currentExercise:", currentExercise);
                        alternativeSelectorModal.open();
                      }}
                      className="w-full rounded-xl sm:rounded-2xl border-2 border-duo-blue bg-duo-blue/10 py-3 sm:py-4 font-bold text-xs sm:text-sm text-duo-blue transition-all hover:bg-duo-blue/20 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        EQUIPAMENTO OCUPADO? VER ALTERNATIVAS (
                        {currentExercise?.alternatives?.length || 0})
                      </span>
                      <span className="sm:hidden">
                        VER ALTERNATIVAS (
                        {currentExercise?.alternatives?.length || 0})
                      </span>
                    </motion.button>

                    {/* Botão CONCLUIR para cardio */}
                    {isCurrentExerciseCardio() && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCardioComplete}
                        className="w-full rounded-xl sm:rounded-2xl bg-duo-green py-3 sm:py-4 font-bold text-white hover:bg-duo-green/90 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>CONCLUIR EXERCÍCIO</span>
                      </motion.button>
                    )}

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {activeWorkout &&
                        activeWorkout.currentExerciseIndex > 0 && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              if (activeWorkout) {
                                const newIndex =
                                  activeWorkout.currentExerciseIndex - 1;
                                // OTIMISTIC UPDATE: Atualizar Zustand e URL primeiro (instantâneo)
                                setCurrentExerciseIndex(newIndex);
                                setExerciseIndexParam(newIndex);

                                // Salvar progresso em background (não bloquear UI)
                                saveWorkoutProgress(workout.id).catch(
                                  (error) => {
                                    console.error(
                                      "Erro ao salvar progresso em background:",
                                      error
                                    );
                                  }
                                );
                              }
                            }}
                            className="rounded-xl sm:rounded-2xl border-2 border-duo-border bg-white py-3 sm:py-4 font-bold text-xs sm:text-sm text-duo-gray-dark transition-all hover:bg-gray-50"
                          >
                            <span className="hidden sm:inline">← ANTERIOR</span>
                            <span className="sm:hidden">ANTERIOR</span>
                          </motion.button>
                        )}
                      {/* Verificar se é o último exercício */}
                      {activeWorkout &&
                      activeWorkout.currentExerciseIndex + 1 >=
                        workout.exercises.length ? (
                        // Último exercício: mostrar botão FINALIZAR
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleFinish}
                          className={cn(
                            "rounded-xl sm:rounded-2xl border-2 border-duo-green bg-duo-green py-3 sm:py-4 font-bold text-xs sm:text-sm text-white transition-all hover:bg-duo-green/90",
                            activeWorkout.currentExerciseIndex === 0 &&
                              "col-span-2"
                          )}
                        >
                          <span className="hidden sm:inline">
                            FINALIZAR TREINO
                          </span>
                          <span className="sm:hidden">FINALIZAR</span>
                        </motion.button>
                      ) : (
                        // Não é o último: mostrar botão PULAR
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSkip}
                          className={cn(
                            "rounded-xl sm:rounded-2xl border-2 border-duo-border bg-white py-3 sm:py-4 font-bold text-xs sm:text-sm text-duo-gray-dark transition-all hover:bg-gray-50",
                            activeWorkout &&
                              activeWorkout.currentExerciseIndex === 0 &&
                              "col-span-2"
                          )}
                        >
                          <span className="hidden sm:inline">
                            PULAR EXERCÍCIO
                          </span>
                          <span className="sm:hidden">PULAR</span>
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
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
