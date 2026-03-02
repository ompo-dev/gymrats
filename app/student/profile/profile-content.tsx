"use client";

import { Edit, Flame, TrendingUp, Trophy, Zap } from "lucide-react";
import { DuoButton, DuoStatCard, DuoStatsGrid } from "@/components/duo";
import { ProfileHeader } from "@/components/ui/profile-header";
import {
  AccountSection,
  PersonalRecordsCard,
  RecentHistoryCard,
  WeightEvolutionCard,
  WeightModal,
} from "./components";
import { useProfilePage } from "./hooks/use-profile-page";

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
  const {
    weightModal,
    newWeight,
    setNewWeight,
    displayProgress,
    weightHistoryLocal,
    currentWeight,
    weightGain,
    recentWorkoutHistory,
    personalRecords,
    lastInProgressWorkout,
    profileUserInfo,
    totalWorkoutsCompleted,
    weeklyWorkouts,
    hasWeightLossGoal,
    isAdmin,
    firstWorkoutUrl,
    router,
    handleLogout,
    handleSwitchToGym,
    handleOpenWeightModal,
    handleSaveWeight,
  } = useProfilePage();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ProfileHeader
        name={profileUserInfo?.name || "Usuário"}
        username={profileUserInfo?.username || "@usuario"}
        memberSince={profileUserInfo?.memberSince || "Jan 2025"}
        stats={{
          workouts: totalWorkoutsCompleted,
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
          <DuoButton
            onClick={handleOpenWeightModal}
            variant="primary"
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
          </DuoButton>
        }
      />

      <DuoStatsGrid.Root columns={4} className="gap-4">
        <DuoStatCard.Simple
          icon={Flame}
          value={displayProgress.currentStreak}
          label="Dias seguidos"
          badge={`Recorde: ${displayProgress.longestStreak}`}
          iconColor="var(--duo-accent)"
        />
        <DuoStatCard.Simple
          icon={Zap}
          value={displayProgress.totalXP}
          label="XP Total"
          badge={`${displayProgress.xpToNextLevel} até nível ${
            displayProgress.currentLevel + 1
          }`}
          iconColor="var(--duo-warning)"
        />
        <DuoStatCard.Simple
          icon={Trophy}
          value={`#${displayProgress.currentLevel}`}
          label="Nível atual"
          badge="Continue treinando"
          iconColor="var(--duo-secondary)"
        />
        <DuoStatCard.Simple
          icon={TrendingUp}
          value={displayProgress.workoutsCompleted}
          label="Treinos"
          badge={
            weeklyWorkouts > 0
              ? `+${weeklyWorkouts} esta semana`
              : "Nenhum esta semana"
          }
          iconColor="var(--duo-primary)"
        />
      </DuoStatsGrid.Root>

      <WeightEvolutionCard
        weightHistory={weightHistoryLocal}
        weightGain={weightGain}
        hasWeightLossGoal={hasWeightLossGoal}
        onOpenWeightModal={handleOpenWeightModal}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentHistoryCard
          workouts={recentWorkoutHistory}
          lastInProgressWorkout={lastInProgressWorkout}
          onWorkoutClick={() => router.push(firstWorkoutUrl)}
        />
        <PersonalRecordsCard
          records={personalRecords}
          onWorkoutClick={() => router.push(firstWorkoutUrl)}
        />
      </div>

      <AccountSection
        isAdmin={isAdmin}
        onSwitchToGym={handleSwitchToGym}
        onLogout={handleLogout}
      />

      <WeightModal
        isOpen={weightModal.isOpen}
        onClose={weightModal.close}
        newWeight={newWeight}
        onNewWeightChange={setNewWeight}
        currentWeight={currentWeight}
        onSave={handleSaveWeight}
      />
    </div>
  );
}
