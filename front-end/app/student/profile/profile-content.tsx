"use client";

import {
  Trophy,
  Flame,
  Zap,
  TrendingUp,
  Calendar,
  Award,
  LogOut,
  ArrowRightLeft,
  Shield,
  Edit,
  X,
  Play,
  ArrowRight,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProfileHeader } from "@/components/ui/profile-header";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { SectionCard } from "@/components/ui/section-card";
import { HistoryCard } from "@/components/ui/history-card";
import { RecordCard } from "@/components/ui/record-card";
import { DuoCard } from "@/components/ui/duo-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useStudent } from "@/hooks/use-student";
import { useLoadPrioritized } from "@/hooks/use-load-prioritized";
import { useModalState } from "@/hooks/use-modal-state";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";
import { useWorkoutStore } from "@/stores/workout-store";
import type {
  WorkoutHistory,
  PersonalRecord,
  Unit,
  WorkoutSession,
} from "@/lib/types";
import type { WeightHistoryItem } from "@/lib/types/student-unified";

/**
 * Componente de Conteúdo do Perfil
 *
 * Arquitetura Offline-First:
 * - Usa apenas dados do store unificado (via useStudent hook)
 * - Não recebe props SSR (dados vêm do store)
 * - Funciona offline com dados em cache
 * - Sincronização automática via syncManager
 */

export function ProfilePageContent() {
  // Carregamento prioritizado: profile, weightHistory, progress, personalRecords aparecem primeiro
  // Se dados já existem no store, só carrega o que falta
  useLoadPrioritized({ context: "profile" });

  const router = useRouter();
  const weightModal = useModalState("weight");
  const [newWeight, setNewWeight] = useState<string>("");

  // Carregar weightHistory, profile, progress e user se não estiverem carregados
  const { loadWeightHistory, loadProfile, loadProgress, loadUser } =
    useStudent("loaders");

  useEffect(() => {
    // Garantir que weightHistory, profile, progress e user sejam carregados
    const loadData = async () => {
      const state = useStudentUnifiedStore.getState();
      if (!state.data.weightHistory || state.data.weightHistory.length === 0) {
        await loadWeightHistory();
      }
      if (!state.data.profile) {
        await loadProfile();
      }
      if (
        !state.data.progress ||
        state.data.progress.workoutsCompleted === undefined
      ) {
        await loadProgress();
      }
      if (!state.data.user || !state.data.user.email) {
        await loadUser();
      }
    };
    loadData();
  }, [loadWeightHistory, loadProfile, loadProgress, loadUser]);

  // Recarregar progresso quando um workout é completado
  useEffect(() => {
    const handleWorkoutCompleted = async () => {
      console.log("[Profile] Workout completado, recarregando progresso...");
      await loadProgress();
    };

    window.addEventListener("workoutCompleted", handleWorkoutCompleted);

    return () => {
      window.removeEventListener("workoutCompleted", handleWorkoutCompleted);
    };
  }, [loadProgress]);

  // ============================================
  // DADOS DO STORE UNIFICADO (Offline-First)
  // ============================================
  // Todos os dados vêm do store unificado, que:
  // - É carregado automaticamente pelo useStudentInitializer no layout
  // - Persiste em IndexedDB (funciona offline)
  // - Sincroniza automaticamente via syncManager
  // - Usa rotas específicas otimizadas (3-5x mais rápido)

  const {
    progress: storeProgress,
    weightHistory: storeWeightHistory,
    weightGain: storeWeightGain,
    profile: storeProfile,
    user: storeUser,
    workoutHistory: storeWorkoutHistory,
    personalRecords: storePersonalRecords,
    units: storeUnits,
    isAdmin: storeIsAdmin,
    role: storeRole,
  } = useStudent(
    "progress",
    "weightHistory",
    "weightGain",
    "profile",
    "user",
    "workoutHistory",
    "personalRecords",
    "units",
    "isAdmin",
    "role"
  );

  const { addWeight } = useStudent("actions");

  // ============================================
  // DADOS DISPLAY (Apenas do Store)
  // ============================================
  // Não usamos mais fallback para props SSR.
  // Todos os dados vêm do store unificado.
  // Se não houver dados ainda, o useStudentInitializer está carregando.

  const displayProgress = storeProgress || {
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    currentLevel: 1,
    xpToNextLevel: 100,
    workoutsCompleted: 0,
    todayXP: 0,
    achievements: [],
    lastActivityDate: new Date().toISOString(),
    dailyGoalXP: 50,
    weeklyXP: [0, 0, 0, 0, 0, 0, 0],
  };

  const weightHistoryLocal = storeWeightHistory || [];

  // Peso atual: priorizar weightHistory (último registro) sobre profile.weight
  // weightHistory é mais confiável pois é atualizado sempre que um novo peso é adicionado
  // Se não houver histórico, usar o peso do perfil (pode ser do onboarding)
  const currentWeight =
    weightHistoryLocal.length > 0
      ? weightHistoryLocal[0].weight
      : storeProfile?.weight ?? null;

  // Calcular weightGain se não estiver calculado mas houver weightHistory
  let weightGain = storeWeightGain ?? null;
  if (weightGain === null && weightHistoryLocal.length > 0) {
    const currentWeightFromHistory = weightHistoryLocal[0]?.weight;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Encontrar peso mais próximo de 1 mês atrás
    const weightOneMonthAgo = weightHistoryLocal.find(
      (wh: WeightHistoryItem) => {
        const whDate = new Date(wh.date);
        return whDate <= oneMonthAgo;
      }
    );

    if (weightOneMonthAgo && currentWeightFromHistory) {
      weightGain = currentWeightFromHistory - weightOneMonthAgo.weight;
    } else if (weightHistoryLocal.length > 1 && currentWeightFromHistory) {
      // Se não houver dados de 1 mês atrás, usar o primeiro registro disponível
      const oldestWeight =
        weightHistoryLocal[weightHistoryLocal.length - 1]?.weight;
      if (oldestWeight) {
        weightGain = currentWeightFromHistory - oldestWeight;
      }
    }
  }
  const workoutHistory = storeWorkoutHistory || [];
  const personalRecords = storePersonalRecords || [];
  const units = storeUnits || [];

  // Calcular número total de treinos completados baseado em units
  // Contar quantos workouts têm completed: true em todas as units
  const totalWorkoutsCompleted = units.reduce((total: number, unit: Unit) => {
    if (!unit.workouts || !Array.isArray(unit.workouts)) return total;
    const completedInUnit = unit.workouts.filter(
      (workout: WorkoutSession) => workout.completed === true
    ).length;
    return total + completedInUnit;
  }, 0);

  // Buscar workoutProgress do store para encontrar último workout iniciado
  const workoutProgress = useWorkoutStore((state) => state.workoutProgress);

  // Encontrar o último workout com pelo menos 1 exercício feito
  const lastInProgressWorkout = (() => {
    const progressEntries = Object.entries(workoutProgress);

    // Filtrar apenas workouts com pelo menos 1 exercício feito
    const workoutsWithProgress = progressEntries
      .filter(([_, progress]) => progress.exerciseLogs.length > 0)
      .map(([workoutId, progress]) => ({
        workoutId,
        progress,
        lastUpdated: progress.lastUpdated
          ? new Date(progress.lastUpdated)
          : progress.startTime,
      }))
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

    if (workoutsWithProgress.length === 0) return null;

    const lastProgress = workoutsWithProgress[0];

    // Buscar informações do workout nos units
    const workout = units
      .flatMap((unit: Unit) => unit.workouts)
      .find((w: WorkoutSession) => w.id === lastProgress.workoutId);

    if (!workout) return null;

    return {
      workout,
      progress: lastProgress.progress,
    };
  })();

  // Criar histórico customizado mostrando apenas exercícios do último workout iniciado
  const recentWorkoutHistory = lastInProgressWorkout
    ? [
        {
          date:
            lastInProgressWorkout.progress.startTime instanceof Date
              ? lastInProgressWorkout.progress.startTime
              : new Date(lastInProgressWorkout.progress.startTime),
          workoutId: lastInProgressWorkout.workout.id,
          workoutName: lastInProgressWorkout.workout.title,
          duration: Math.round(
            (new Date().getTime() -
              (lastInProgressWorkout.progress.startTime instanceof Date
                ? lastInProgressWorkout.progress.startTime.getTime()
                : new Date(
                    lastInProgressWorkout.progress.startTime
                  ).getTime())) /
              60000
          ),
          totalVolume: lastInProgressWorkout.progress.totalVolume || 0,
          exercises: lastInProgressWorkout.progress.exerciseLogs.map((log) => ({
            id: log.exerciseId,
            exerciseId: log.exerciseId,
            exerciseName: log.exerciseName,
            workoutId: lastInProgressWorkout.workout.id,
            date:
              lastInProgressWorkout.progress.startTime instanceof Date
                ? lastInProgressWorkout.progress.startTime
                : new Date(lastInProgressWorkout.progress.startTime),
            sets: log.sets || [],
            notes: log.notes,
            formCheckScore: log.formCheckScore,
            difficulty: log.difficulty || "medio",
          })),
          overallFeedback: undefined as
            | "excelente"
            | "bom"
            | "regular"
            | "ruim"
            | undefined,
          bodyPartsFatigued: [],
        },
      ]
    : workoutHistory.slice(0, 1); // Se não houver workout em progresso, mostrar último completo
  // Extrair username do email (parte antes do @)
  // O username já vem do backend formatado como @username, mas vamos garantir
  const getUsernameFromEmail = (user: typeof storeUser): string => {
    if (!user) return "@usuario";
    // Se já tem username formatado, usar ele
    if (user.username && user.username.startsWith("@")) {
      return user.username;
    }
    // Caso contrário, extrair do email
    if (user.email) {
      const username = user.email.split("@")[0];
      return `@${username}`;
    }
    return "@usuario";
  };

  const profileUserInfo = storeUser
    ? {
        name: storeUser.name || "Usuário",
        username: getUsernameFromEmail(storeUser),
        memberSince: storeUser.memberSince || "Jan 2025",
      }
    : null;

  const isAdmin = storeIsAdmin || storeRole === "ADMIN";

  // Obter o primeiro workout disponível para CTAs
  const firstWorkout =
    units.length > 0 && units[0]?.workouts?.length > 0
      ? units[0].workouts[0]
      : null;

  const firstWorkoutUrl = firstWorkout
    ? `/student?tab=learn&modal=workout&workoutId=${firstWorkout.id}`
    : "/student?tab=learn";

  // Calcular weeklyWorkouts do workoutHistory
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyWorkouts = workoutHistory.filter(
    (w: WorkoutHistory) => new Date(w.date) >= oneWeekAgo
  ).length;

  const hasWeightLossGoal = storeProfile?.hasWeightLossGoal || false;
  const ranking = null; // TODO: Adicionar ao store se necessário

  const handleLogout = async () => {
    try {
      // Limpar store de autenticação primeiro
      const { useAuthStore } = await import("@/stores");
      useAuthStore.getState().logout();

      // Limpar localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        localStorage.removeItem("isAdmin");
      }

      // Tentar fazer logout no servidor (não bloquear se falhar)
      try {
        const { apiClient } = await import("@/lib/api/client");
        await apiClient.post("/api/auth/sign-out");
      } catch (apiError) {
        console.error("Erro ao fazer logout no servidor:", apiError);
        // Continuar mesmo se falhar
      }

      // Redirecionar para welcome usando window.location para forçar navegação completa
      // Isso evita qualquer pré-carregamento do Next.js Router
      if (typeof window !== "undefined") {
        window.location.href = "/welcome";
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Mesmo em caso de erro, redirecionar para welcome
      if (typeof window !== "undefined") {
        window.location.href = "/welcome";
      }
    }
  };

  const handleSwitchToGym = () => {
    router.push("/gym");
  };

  const handleOpenWeightModal = () => {
    setNewWeight(currentWeight?.toFixed(1) || "");
    weightModal.open();
  };

  const handleSaveWeight = async () => {
    const weightValue = parseFloat(newWeight);

    if (isNaN(weightValue) || weightValue <= 0) {
      alert("Por favor, insira um peso válido maior que zero.");
      return;
    }

    // Fechar modal imediatamente
    weightModal.close();
    setNewWeight("");

    // Usar action do store (já faz optimistic update e sync via syncManager)
    // syncManager gerencia offline/online automaticamente:
    // - Se online: envia para API imediatamente
    // - Se offline: salva na fila e sincroniza quando online
    await addWeight(weightValue);

    // Não precisa de router.refresh() - o store já atualiza automaticamente!
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <ProfileHeader
        name={profileUserInfo?.name || "Usuário"}
        username={profileUserInfo?.username || "@usuario"}
        memberSince={profileUserInfo?.memberSince || "Jan 2025"}
        stats={{
          workouts: totalWorkoutsCompleted, // Usar workoutHistory.length em vez de displayProgress.workoutsCompleted
          streak: displayProgress.currentStreak,
        }}
        quickStats={[
          {
            value:
              weightGain !== null && weightGain !== undefined
                ? `${weightGain > 0 ? "+" : ""}${weightGain.toFixed(1)}`
                : "0.0",
            label:
              weightGain !== null && weightGain !== undefined
                ? weightGain < 0
                  ? "kg Perdidos"
                  : weightGain > 0
                  ? "kg Ganhos"
                  : "Sem mudança"
                : "kg",
            highlighted:
              weightGain !== null &&
              weightGain !== undefined &&
              weightGain !== 0,
          },
        ]}
        quickStatsButtons={
          <Button
            onClick={handleOpenWeightModal}
            variant="light-blue"
            className="w-full h-auto p-3 text-center"
          >
            <div className="flex items-center justify-center gap-1 flex-col">
              <div className="mb-1 text-xl font-bold">
                {currentWeight ? (
                  <div className="flex items-center justify-center gap-1">
                    <span>{currentWeight.toFixed(1)}</span>
                    <Edit className="h-3 w-3 opacity-60" />
                  </div>
                ) : (
                  "N/A"
                )}
              </div>
              <div className="text-xs font-semibold">kg Atual</div>
            </div>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCardLarge
          icon={Flame}
          value={displayProgress.currentStreak}
          label="Dias seguidos"
          subtitle={`Recorde: ${displayProgress.longestStreak}`}
          iconColor="duo-orange"
        />
        <StatCardLarge
          icon={Zap}
          value={displayProgress.totalXP}
          label="XP Total"
          subtitle={`${displayProgress.xpToNextLevel} até nível ${
            displayProgress.currentLevel + 1
          }`}
          iconColor="duo-yellow"
        />
        <StatCardLarge
          icon={Trophy}
          value={`#${displayProgress.currentLevel}`}
          label="Nível atual"
          subtitle={
            ranking !== null ? `Top ${ranking}% global` : "Calculando..."
          }
          iconColor="duo-blue"
        />
        <StatCardLarge
          icon={TrendingUp}
          value={displayProgress.workoutsCompleted}
          label="Treinos"
          subtitle={
            weeklyWorkouts > 0
              ? `+${weeklyWorkouts} esta semana`
              : "Nenhum esta semana"
          }
          iconColor="duo-green"
        />
      </div>

      <SectionCard
        icon={TrendingUp}
        title="Evolução de Peso"
        headerAction={
          weightGain !== null && weightGain !== undefined ? (
            <div className="text-right">
              <div
                className={`text-2xl font-bold ${
                  // Se objetivo é perder peso, perda é positiva (verde)
                  // Se objetivo é ganhar massa, ganho é positivo (verde)
                  // Caso contrário, neutro (azul)
                  hasWeightLossGoal
                    ? weightGain < 0
                      ? "text-duo-green"
                      : weightGain > 0
                      ? "text-duo-blue"
                      : "text-duo-gray-dark"
                    : weightGain > 0
                    ? "text-duo-green"
                    : weightGain < 0
                    ? "text-duo-blue"
                    : "text-duo-gray-dark"
                }`}
              >
                {weightGain > 0 ? "+" : ""}
                {weightGain.toFixed(1)}kg
              </div>
              <div className="text-xs text-duo-gray-dark">
                {weightGain < 0
                  ? "Perda"
                  : weightGain > 0
                  ? "Ganho"
                  : "Sem mudança"}{" "}
                no último mês
              </div>
            </div>
          ) : null
        }
      >
        {weightHistoryLocal.length > 0 ? (
          <div className="space-y-3">
            {weightHistoryLocal.map(
              (record: WeightHistoryItem, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="text-sm text-duo-gray-dark">
                    {new Date(record.date).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 flex-1 rounded-full bg-duo-border"
                      style={{ width: `${record.weight}px` }}
                    >
                      <div
                        className="h-full rounded-full bg-duo-green"
                        style={{ width: `${(record.weight / 85) * 100}%` }}
                      />
                    </div>
                    <div className="w-16 text-right font-bold text-duo-text">
                      {record.weight}kg
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-8 px-4 text-center"
          >
            <Target className="h-12 w-12 text-duo-gray-dark mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-duo-text mb-2">
              Comece sua jornada!
            </h3>
            <p className="text-sm text-duo-gray-dark mb-4 max-w-sm">
              Registre seu peso para acompanhar sua evolução e ver seu progresso
              ao longo do tempo.
            </p>
            <Button
              onClick={handleOpenWeightModal}
              variant="light-blue"
              className="w-full max-w-xs"
            >
              <Edit className="h-4 w-4 mr-2" />
              Registrar Peso Inicial
            </Button>
          </motion.div>
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard icon={Calendar} title="Histórico Recente">
          {recentWorkoutHistory.length > 0 ? (
            <div className="space-y-3">
              {recentWorkoutHistory.map(
                (workout: WorkoutHistory, index: number) => (
                  <div key={index}>
                    <HistoryCard
                      title={workout.workoutName}
                      date={workout.date}
                      status={
                        workout.overallFeedback === "excelente"
                          ? "excelente"
                          : workout.overallFeedback === "bom"
                          ? "bom"
                          : "regular"
                      }
                      metadata={[
                        { icon: "⏱️", label: `${workout.duration} min` },
                        {
                          icon: "💪",
                          label: `${workout.totalVolume.toLocaleString()} kg`,
                        },
                        {
                          icon: "🏋️",
                          label: `${workout.exercises.length} exercício${
                            workout.exercises.length !== 1 ? "s" : ""
                          }`,
                        },
                      ]}
                    />
                    {/* Mostrar apenas os exercícios do último workout iniciado */}
                    {lastInProgressWorkout && workout.exercises.length > 0 && (
                      <div className="mt-2 ml-4 space-y-1">
                        {workout.exercises.map((exercise, exIndex) => (
                          <div
                            key={exIndex}
                            className="text-sm text-duo-gray-dark flex items-center gap-2"
                          >
                            <span className="text-duo-green">✓</span>
                            <span>{exercise.exerciseName}</span>
                            {exercise.sets && exercise.sets.length > 0 && (
                              <span className="text-xs text-duo-gray">
                                ({exercise.sets.length} séries)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-8 px-4 text-center"
            >
              <Play className="h-12 w-12 text-duo-gray-dark mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-duo-text mb-2">
                Hora de começar!
              </h3>
              <p className="text-sm text-duo-gray-dark mb-4 max-w-sm">
                Complete seu primeiro treino para ver seu histórico aqui. Vamos
                começar com algo fácil e tranquilo!
              </p>
              <Button
                onClick={() => router.push(firstWorkoutUrl)}
                variant="light-blue"
                className="w-full max-w-xs"
              >
                <Play className="h-4 w-4 mr-2" />
                Primeiro Treino
              </Button>
            </motion.div>
          )}
        </SectionCard>

        <SectionCard icon={Award} title="Recordes Pessoais">
          {personalRecords.length > 0 ? (
            <div className="space-y-3">
              {personalRecords.map((record: PersonalRecord, index: number) => (
                <RecordCard
                  key={index}
                  exerciseName={record.exerciseName}
                  date={record.date}
                  value={record.value}
                  unit={record.type === "max-weight" ? "kg" : " reps"}
                  previousBest={record.previousBest}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-8 px-4 text-center"
            >
              <Trophy className="h-12 w-12 text-duo-gray-dark mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-duo-text mb-2">
                Seus recordes estão esperando!
              </h3>
              <p className="text-sm text-duo-gray-dark mb-4 max-w-sm">
                Complete treinos e quebre seus próprios recordes. Cada treino é
                uma oportunidade de superar seus limites!
              </p>
              <Button
                onClick={() => router.push(firstWorkoutUrl)}
                variant="light-blue"
                className="w-full max-w-xs"
              >
                <Play className="h-4 w-4 mr-2" />
                Primeiro Treino
              </Button>
            </motion.div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Conta" icon={Shield} variant="blue">
        <div className="space-y-3">
          {/* Mostrar botão de trocar apenas se for admin */}
          {/* Verificar todas as fontes possíveis para garantir que funcione */}
          {isAdmin && (
            <DuoCard
              variant="default"
              size="default"
              className="cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]"
              onClick={handleSwitchToGym}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-duo-blue/10 p-3">
                  <ArrowRightLeft className="h-5 w-5 text-duo-blue" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-duo-text">
                    Trocar para Perfil de Academia
                  </div>
                  <div className="text-xs text-duo-gray-dark">
                    Acessar como academia
                  </div>
                </div>
              </div>
            </DuoCard>
          )}
          <DuoCard
            variant="default"
            size="default"
            className="cursor-pointer transition-all hover:border-red-300 active:scale-[0.98]"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-50 p-3">
                <LogOut className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-bold text-duo-text">Sair</div>
                <div className="text-xs text-duo-gray-dark">
                  Fazer logout da conta
                </div>
              </div>
            </div>
          </DuoCard>
        </div>
      </SectionCard>

      {/* Modal para editar peso */}
      <AnimatePresence>
        {weightModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 sm:items-center"
            onClick={weightModal.close}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.3,
              }}
              className="w-full max-w-md rounded-t-3xl bg-white sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="border-b-2 border-gray-300 p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Atualizar Peso
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={weightModal.close}
                    className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label
                      htmlFor="weight"
                      className="block text-sm font-bold text-gray-600"
                    >
                      Peso Atual (kg)
                    </label>
                    <input
                      id="weight"
                      type="number"
                      step="0.1"
                      min="0"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      placeholder="Ex: 91.5"
                      className="w-full rounded-xl border-2 border-gray-300 py-3 px-4 font-bold text-gray-900 placeholder:text-gray-400 focus:border-duo-green focus:outline-none text-lg"
                      autoFocus
                    />
                    <p className="text-xs text-gray-600">
                      Digite seu peso atual em quilogramas
                    </p>
                  </div>

                  <AnimatePresence>
                    {currentWeight && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4"
                      >
                        <p className="text-sm text-gray-600">
                          Peso anterior:{" "}
                          <span className="font-bold text-gray-900">
                            {currentWeight.toFixed(1)}kg
                          </span>
                        </p>
                        {newWeight &&
                          !isNaN(parseFloat(newWeight)) &&
                          parseFloat(newWeight) !== currentWeight && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-sm mt-2 font-bold"
                            >
                              {parseFloat(newWeight) > currentWeight ? (
                                <span className="text-duo-blue">
                                  Ganho: +
                                  {(
                                    parseFloat(newWeight) - currentWeight
                                  ).toFixed(1)}
                                  kg
                                </span>
                              ) : (
                                <span className="text-duo-green">
                                  Perda:{" "}
                                  {(
                                    parseFloat(newWeight) - currentWeight
                                  ).toFixed(1)}
                                  kg
                                </span>
                              )}
                            </motion.p>
                          )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="border-t-2 border-gray-300 p-6"
                >
                  <div className="flex gap-3">
                    <Button
                      onClick={weightModal.close}
                      variant="white"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveWeight}
                      disabled={!newWeight || isNaN(parseFloat(newWeight))}
                      className="flex-1"
                    >
                      Salvar
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
