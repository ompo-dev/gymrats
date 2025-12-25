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
import { useEffect, useState } from "react";

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
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState<string>("");
  const [localCurrentWeight, setLocalCurrentWeight] = useState<number | null>(
    currentWeight ?? null
  );
  const [localWeightGain, setLocalWeightGain] = useState<number | null>(
    weightGain ?? null
  );
  const [weightHistoryLocal, setWeightHistoryLocal] =
    useState<WeightHistoryItem[]>(weightHistory);

  // Buscar do localStorage primeiro (rápido, sem delay)
  const storageInfo = getUserInfoFromStorage();

  // Buscar dados atualizados da API no cliente (confiável)
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          const isAdminFromAPI =
            data.user?.role === "ADMIN" || data.user?.userType === "admin";
          setActualIsAdmin(isAdminFromAPI);
          console.log(
            "[ProfilePageContent] Dados da API:",
            data.user,
            "isAdminFromAPI:",
            isAdminFromAPI
          );
        }
      } catch (error) {
        console.error("[ProfilePageContent] Erro ao buscar sessão:", error);
      }
    }

    fetchUserInfo();
  }, []);

  // Sincronizar valores locais com props
  useEffect(() => {
    setLocalCurrentWeight(currentWeight ?? null);
    setLocalWeightGain(weightGain ?? null);
    setWeightHistoryLocal(weightHistory);
  }, [currentWeight, weightGain, weightHistory]);

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
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/auth/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleSwitchToGym = () => {
    router.push("/gym");
  };

  const handleOpenWeightModal = () => {
    setNewWeight(localCurrentWeight?.toFixed(1) || "");
    setIsWeightModalOpen(true);
  };

  const handleSaveWeight = async () => {
    const weightValue = parseFloat(newWeight);

    if (isNaN(weightValue) || weightValue <= 0) {
      alert("Por favor, insira um peso válido maior que zero.");
      return;
    }

    // Atualização otimista - fechar modal e atualizar estado imediatamente
    const previousWeight = localCurrentWeight;
    const previousGain = localWeightGain;

    // Calcular ganho/perda otimista comparando com peso de 1 mês atrás
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Encontrar peso de 1 mês atrás no histórico local
    const sortedHistory = [...weightHistoryLocal].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const weightOneMonthAgo = sortedHistory.find((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate <= oneMonthAgo;
    });

    // Calcular ganho/perda otimista
    let optimisticGain: number | null = null;
    if (weightOneMonthAgo) {
      optimisticGain = weightValue - weightOneMonthAgo.weight;
    } else if (
      sortedHistory.length > 0 &&
      sortedHistory[sortedHistory.length - 1] !== sortedHistory[0]
    ) {
      // Se não há registro de 1 mês atrás, usar o mais antigo disponível
      const oldestEntry = sortedHistory[sortedHistory.length - 1];
      optimisticGain = weightValue - oldestEntry.weight;
    } else if (previousWeight) {
      // Fallback: comparar com peso anterior
      optimisticGain = weightValue - previousWeight;
    }

    // Atualizar estado local imediatamente
    setLocalCurrentWeight(weightValue);
    if (optimisticGain !== null) {
      setLocalWeightGain(optimisticGain);
    }

    // Adicionar novo peso ao histórico local otimisticamente
    const newWeightEntry: WeightHistoryItem = {
      date: new Date(),
      weight: weightValue,
    };
    setWeightHistoryLocal((prev) => [newWeightEntry, ...prev].slice(0, 30));

    // Fechar modal imediatamente
    setIsWeightModalOpen(false);
    setNewWeight("");

    // Fazer requisição em background
    try {
      const response = await fetch("/api/students/weight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weight: weightValue,
          date: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        // Buscar histórico atualizado para recalcular weightGain corretamente
        const historyResponse = await fetch("/api/students/weight?limit=30");
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          if (historyData.history && historyData.history.length > 0) {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            const sortedHistory = [...historyData.history].sort(
              (a: any, b: any) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            const weightOneMonthAgo = sortedHistory.find((entry: any) => {
              const entryDate = new Date(entry.date);
              return entryDate <= oneMonthAgo;
            });

            if (weightOneMonthAgo) {
              const gain = weightValue - weightOneMonthAgo.weight;
              setLocalWeightGain(gain);
            } else {
              const oldestEntry = sortedHistory[sortedHistory.length - 1];
              if (oldestEntry && oldestEntry !== sortedHistory[0]) {
                const gain = weightValue - oldestEntry.weight;
                setLocalWeightGain(gain);
              }
            }
          }
        }

        // Recarregar dados do servidor em background
        router.refresh();
      } else {
        // Reverter estado otimista em caso de erro
        setLocalCurrentWeight(previousWeight);
        setLocalWeightGain(previousGain);

        const error = await response.json();
        alert(error.error || "Erro ao salvar peso. Tente novamente.");
      }
    } catch (error) {
      // Reverter estado otimista em caso de erro
      setLocalCurrentWeight(previousWeight);
      setLocalWeightGain(previousGain);

      console.error("Erro ao salvar peso:", error);
      alert("Erro ao salvar peso. Tente novamente.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <ProfileHeader
        name={profileUserInfo?.name || "Usuário"}
        username={profileUserInfo?.username || "@usuario"}
        memberSince={profileUserInfo?.memberSince || "Jan 2025"}
        stats={{
          workouts: progress.workoutsCompleted,
          friends: 12, // TODO: Implementar contagem de amigos
          streak: progress.currentStreak,
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
          value={progress.currentStreak}
          label="Dias seguidos"
          subtitle={`Recorde: ${progress.longestStreak}`}
          iconColor="duo-orange"
        />
        <StatCardLarge
          icon={Zap}
          value={progress.totalXP}
          label="XP Total"
          subtitle={`${progress.xpToNextLevel} até nível ${
            progress.currentLevel + 1
          }`}
          iconColor="duo-yellow"
        />
        <StatCardLarge
          icon={Trophy}
          value={`#${progress.currentLevel}`}
          label="Nível atual"
          subtitle={
            ranking !== null ? `Top ${ranking}% global` : "Calculando..."
          }
          iconColor="duo-blue"
        />
        <StatCardLarge
          icon={TrendingUp}
          value={progress.workoutsCompleted}
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
          {weightHistory.map((record, index) => (
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
          ))}
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
        {isWeightModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center"
            onClick={() => setIsWeightModalOpen(false)}
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
                    onClick={() => setIsWeightModalOpen(false)}
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
                      onClick={() => setIsWeightModalOpen(false)}
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
