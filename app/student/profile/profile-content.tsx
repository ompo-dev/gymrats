"use client";

import { Trophy, Flame, Zap, TrendingUp, Calendar, Award, LogOut, ArrowRightLeft, Shield } from "lucide-react";
import { ProfileHeader } from "@/components/ui/profile-header";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { SectionCard } from "@/components/ui/section-card";
import { HistoryCard } from "@/components/ui/history-card";
import { RecordCard } from "@/components/ui/record-card";
import { DuoCard } from "@/components/ui/duo-card";
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
}

export function ProfilePageContent({
  progress,
  workoutHistory,
  personalRecords,
  weightHistory,
  userInfo = { isAdmin: false, role: null },
}: ProfilePageContentProps) {
  const router = useRouter();
  const [actualIsAdmin, setActualIsAdmin] = useState(false);
  
  // Buscar do localStorage primeiro (rápido, sem delay)
  const storageInfo = getUserInfoFromStorage();
  
  // Buscar dados atualizados da API no cliente (confiável)
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          const isAdminFromAPI = data.user?.role === "ADMIN" || data.user?.userType === "admin";
          setActualIsAdmin(isAdminFromAPI);
          console.log("[ProfilePageContent] Dados da API:", data.user, "isAdminFromAPI:", isAdminFromAPI);
        }
      } catch (error) {
        console.error("[ProfilePageContent] Erro ao buscar sessão:", error);
      }
    }
    
    fetchUserInfo();
  }, []);
  
  // Usar dados da API como fonte principal, localStorage e userInfo como fallback
  const isAdmin = actualIsAdmin || storageInfo.isAdmin || userInfo?.role === "ADMIN" || userInfo?.isAdmin;
  
  console.log("[ProfilePageContent] actualIsAdmin:", actualIsAdmin, "storageInfo.isAdmin:", storageInfo.isAdmin, "userInfo?.role:", userInfo?.role, "isAdmin final:", isAdmin);

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

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <ProfileHeader
        name="AtletaFit"
        username="@atletafit"
        memberSince="Jan 2025"
        stats={{
          workouts: progress.workoutsCompleted,
          friends: 12,
          streak: progress.currentStreak,
        }}
        quickStats={[
          { value: progress.currentLevel, label: "Nível" },
          { value: progress.totalXP, label: "XP Total" },
          { value: "82.5", label: "kg Atual" },
          { value: "+4.5", label: "kg Ganhos", highlighted: true },
        ]}
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
          subtitle="Top 15% global"
          iconColor="duo-blue"
        />
        <StatCardLarge
          icon={TrendingUp}
          value={progress.workoutsCompleted}
          label="Treinos"
          subtitle="+5 esta semana"
          iconColor="duo-green"
        />
      </div>

      <SectionCard
        icon={TrendingUp}
        title="Evolução de Peso"
        headerAction={
          <div className="text-right">
            <div className="text-2xl font-bold text-duo-green">+4.5kg</div>
            <div className="text-xs text-duo-gray-dark">Últimos 3 meses</div>
          </div>
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

      <SectionCard title="Conta" icon={Shield} variant="red">
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
                <div className="text-sm font-bold text-duo-text">
                  Sair
                </div>
                <div className="text-xs text-duo-gray-dark">
                  Fazer logout da conta
                </div>
              </div>
            </div>
          </DuoCard>
        </div>
      </SectionCard>
    </div>
  );
}
