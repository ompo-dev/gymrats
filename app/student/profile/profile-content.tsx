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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProfileHeader } from "@/components/ui/profile-header";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { SectionCard } from "@/components/ui/section-card";
import { HistoryCard } from "@/components/ui/history-card";
import { RecordCard } from "@/components/ui/record-card";
import { DuoCard } from "@/components/ui/duo-card";
import { Button } from "@/components/ui/button";
import type { UserProgress, WorkoutHistory, PersonalRecord } from "@/lib/types";
import { useRouter } from "next/navigation";
import { getUserInfoFromStorage } from "@/lib/utils/user-info";
import { useEffect, useState, useRef } from "react";
import { useStudent } from "@/hooks/use-student";
import { useModalState } from "@/hooks/use-modal-state";

interface WeightHistoryItem {
  date: Date | string;
  weight: number;
}

interface ProfilePageContentProps {
  progress: UserProgress;
  workoutHistory: WorkoutHistory[];
  personalRecords: PersonalRecord[];
  weightHistory: WeightHistoryItem[];
  userInfo?: { isAdmin: boolean; role: string | null };
  profileUserInfo?: {
    name: string;
    username: string;
    memberSince: string;
  } | null;
  currentWeight?: number | null;
  weightGain?: number | null;
  weeklyWorkouts?: number;
  ranking?: number | null;
  hasWeightLossGoal?: boolean;
}

export function ProfilePageContent({
  progress,
  workoutHistory,
  personalRecords,
  weightHistory,
  userInfo = { isAdmin: false, role: null },
  profileUserInfo,
  currentWeight,
  weightGain,
  weeklyWorkouts = 0,
  ranking,
  hasWeightLossGoal = false,
}: ProfilePageContentProps) {
  const router = useRouter();
  const [actualIsAdmin, setActualIsAdmin] = useState(false);
  const weightModal = useModalState("weight");
  const [newWeight, setNewWeight] = useState<string>("");

  // Usar hook unificado
  const {
    progress: storeProgress,
    weightHistory: storeWeightHistory,
    weightGain: storeWeightGain,
    profile: storeProfile,
    user: storeUser,
  } = useStudent("progress", "weightHistory", "weightGain", "profile", "user");
  const { addWeight } = useStudent("actions");

  // Usar dados do store com fallback para props
  const localCurrentWeight = storeProfile?.weight || currentWeight;
  const localWeightGain = storeWeightGain ?? weightGain ?? null;
  const weightHistoryLocal =
    storeWeightHistory.length > 0 ? storeWeightHistory : weightHistory;
  const displayProgress = storeProgress || progress;

  // Carregar dados do store ao montar
  const { loadUser, loadProgress, loadWeightHistory } = useStudent("loaders");

  // Flag para evitar múltiplas chamadas simultâneas
  const loadingRef = useRef({ user: false, progress: false, weight: false });

  useEffect(() => {
    // Carregar dados se não tiver no store (apenas uma vez)
    if (!storeUser && !loadingRef.current.user) {
      loadingRef.current.user = true;
      loadUser().finally(() => {
        loadingRef.current.user = false;
      });
    }
    if (!storeProgress && !loadingRef.current.progress) {
      loadingRef.current.progress = true;
      loadProgress().finally(() => {
        loadingRef.current.progress = false;
      });
    }
    if ((!storeWeightHistory || storeWeightHistory.length === 0) && !loadingRef.current.weight) {
      loadingRef.current.weight = true;
      loadWeightHistory().finally(() => {
        loadingRef.current.weight = false;
      });
    }
  }, [
    storeUser,
    storeProgress,
    storeWeightHistory,
    // Remover funções das dependências para evitar loop infinito
    // loadUser, loadProgress, loadWeightHistory,
  ]);

  // Buscar do localStorage primeiro (rápido, sem delay)
  const storageInfo = getUserInfoFromStorage();

  // Usar dados do store para isAdmin
  useEffect(() => {
    if (storeUser) {
      const isAdminFromStore =
        storeUser.role === "ADMIN" || storeUser.role === "admin";
      setActualIsAdmin(isAdminFromStore);
    } else if (userInfo) {
      setActualIsAdmin(userInfo.isAdmin);
    }
  }, [storeUser, userInfo]);

  // displayProgress já está definido acima usando hook

  // Usar dados da API como fonte principal, localStorage e userInfo como fallback
  const isAdmin =
    actualIsAdmin ||
    storageInfo.isAdmin ||
    userInfo?.role === "ADMIN" ||
    userInfo?.isAdmin;

  console.log(
    "[ProfilePageContent] actualIsAdmin:",
    actualIsAdmin,
    "storageInfo.isAdmin:",
    storageInfo.isAdmin,
    "userInfo?.role:",
    userInfo?.role,
    "isAdmin final:",
    isAdmin
  );

  const handleLogout = async () => {
    try {
      // Usar axios client para logout (API → Zustand → Component)
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.post("/api/auth/sign-out");

      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleSwitchToGym = () => {
    router.push("/gym");
  };

  const handleOpenWeightModal = () => {
    setNewWeight(localCurrentWeight?.toFixed(1) || "");
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

    // Usar action do store (já faz optimistic update e sync)
    await addWeight(weightValue);

    // Recarregar dados do servidor em background
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <ProfileHeader
        name={profileUserInfo?.name || "Usuário"}
        username={profileUserInfo?.username || "@usuario"}
        memberSince={profileUserInfo?.memberSince || "Jan 2025"}
        stats={{
          workouts: displayProgress.workoutsCompleted,
          friends: 12, // TODO: Implementar contagem de amigos
          streak: displayProgress.currentStreak,
        }}
        quickStats={[
          {
            value:
              localWeightGain !== null && localWeightGain !== undefined
                ? `${localWeightGain > 0 ? "+" : ""}${localWeightGain.toFixed(
                    1
                  )}`
                : "N/A",
            label:
              localWeightGain !== null && localWeightGain !== undefined
                ? localWeightGain < 0
                  ? "kg Perdidos"
                  : "kg Ganhos"
                : "kg",
            highlighted:
              localWeightGain !== null &&
              localWeightGain !== undefined &&
              localWeightGain !== 0,
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
                {localCurrentWeight ? (
                  <div className="flex items-center justify-center gap-1">
                    <span>{localCurrentWeight.toFixed(1)}</span>
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
          localWeightGain !== null && localWeightGain !== undefined ? (
            <div className="text-right">
              <div
                className={`text-2xl font-bold ${
                  // Se objetivo é perder peso, perda é positiva (verde)
                  // Se objetivo é ganhar massa, ganho é positivo (verde)
                  // Caso contrário, neutro (azul)
                  hasWeightLossGoal
                    ? localWeightGain < 0
                      ? "text-duo-green"
                      : localWeightGain > 0
                      ? "text-duo-blue"
                      : "text-duo-gray-dark"
                    : localWeightGain > 0
                    ? "text-duo-green"
                    : localWeightGain < 0
                    ? "text-duo-blue"
                    : "text-duo-gray-dark"
                }`}
              >
                {localWeightGain > 0 ? "+" : ""}
                {localWeightGain.toFixed(1)}kg
              </div>
              <div className="text-xs text-duo-gray-dark">
                {localWeightGain < 0
                  ? "Perda"
                  : localWeightGain > 0
                  ? "Ganho"
                  : "Sem mudança"}{" "}
                no último mês
              </div>
            </div>
          ) : null
        }
      >
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
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard icon={Calendar} title="Histórico Recente">
          <div className="space-y-3">
            {workoutHistory.map((workout, index) => (
              <HistoryCard
                key={index}
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
                ]}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={Award} title="Recordes Pessoais">
          <div className="space-y-3">
            {personalRecords.map((record, index) => (
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
        </SectionCard>
      </div>

      <SectionCard title="Conta" icon={Shield} variant="blue">
        <div className="space-y-3">
          {/* Mostrar botão de trocar apenas se for admin */}
          {/* Verificar todas as fontes possíveis para garantir que funcione */}
          {(isAdmin || userInfo?.role === "ADMIN") && (
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
                    {localCurrentWeight && (
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
                            {localCurrentWeight.toFixed(1)}kg
                          </span>
                        </p>
                        {newWeight &&
                          !isNaN(parseFloat(newWeight)) &&
                          parseFloat(newWeight) !== localCurrentWeight && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-sm mt-2 font-bold"
                            >
                              {parseFloat(newWeight) > localCurrentWeight ? (
                                <span className="text-duo-blue">
                                  Ganho: +
                                  {(
                                    parseFloat(newWeight) - localCurrentWeight
                                  ).toFixed(1)}
                                  kg
                                </span>
                              ) : (
                                <span className="text-duo-green">
                                  Perda:{" "}
                                  {(
                                    parseFloat(newWeight) - localCurrentWeight
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
