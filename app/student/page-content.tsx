"use client";

import { Suspense, useState, useEffect } from "react";
import { parseAsString, useQueryState } from "nuqs";

import { PersonalizationPage } from "@/app/student/personalization/personalization-page";
import { CardioFunctionalPage } from "@/app/student/cardio/cardio-functional-page";
import { DietPage } from "@/app/student/diet/diet-page";
import { EducationPage } from "@/components/organisms/education/education-page";
import { ProfilePage } from "@/app/student/profile/profile-page";
import { StudentPaymentsPage } from "@/app/student/payments/student-payments-page";
import { LearningPath } from "@/app/student/learn/learning-path";
import { StudentMoreMenu } from "@/app/student/more/student-more-menu";
import { MuscleExplorer } from "@/components/organisms/education/muscle-explorer";
import { EducationalLessons } from "@/components/organisms/education/educational-lessons";

import { GymMap } from "@/components/organisms/sections/gym-map";
import { Heart, Flame, Zap, Trophy, TrendingUp, Dumbbell } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { WhileInView } from "@/components/animations/while-in-view";
import { motion } from "motion/react";
import { useStudent } from "@/hooks/use-student";
import { StatCardLarge } from "@/components/molecules/cards/stat-card-large";
import { SectionCard } from "@/components/molecules/cards/section-card";
import { ShopCard } from "@/components/organisms/sections/shop-card";
import { WeightProgressCard } from "@/components/organisms/home/home/weight-progress-card";
import { RecentWorkoutsCard } from "@/components/organisms/home/home/recent-workouts-card";
import { LevelProgressCard } from "@/components/organisms/home/home/level-progress-card";
import type { Unit } from "@/lib/types";
import type { GymLocation } from "@/lib/types";

import type { UserProgress, WorkoutHistory, PersonalRecord } from "@/lib/types";

interface ProfileData {
  progress: UserProgress;
  workoutHistory: WorkoutHistory[];
  personalRecords: PersonalRecord[];
  weightHistory: Array<{ date: Date | string; weight: number }>;
  userInfo?: {
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

interface StudentHomeContentProps {
  units: Unit[];
  gymLocations: GymLocation[];
  initialProgress: {
    currentStreak: number;
    longestStreak: number;
    totalXP: number;
    todayXP: number;
  };
  profileData?: ProfileData;
  subscription?: {
    id: string;
    plan: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt: Date | null;
    trialStart: Date | null;
    trialEnd: Date | null;
    isTrial: boolean;
    daysRemaining: number | null;
  } | null;
  userInfo?: { isAdmin: boolean; role: string | null };
}

function StudentHomeContent({
  units,
  gymLocations,
  initialProgress,
  profileData,
  subscription,
  userInfo = { isAdmin: false, role: null },
}: StudentHomeContentProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [tab] = useQueryState("tab", parseAsString.withDefault("home"));
  const [educationView, setEducationView] = useQueryState(
    "view",
    parseAsString.withDefault("menu")
  );
  const [muscleId, setMuscleId] = useQueryState("muscle", parseAsString);
  const [exerciseId, setExerciseId] = useQueryState("exercise", parseAsString);
  const [lessonId, setLessonId] = useQueryState("lesson", parseAsString);

  // Usar hook unificado
  const {
    progress: storeProgress,
    user: storeUser,
    units: storeUnits,
    gymLocations: storeGymLocations,
    dayPasses: storeDayPasses,
    workoutHistory: storeWorkoutHistory,
    weightHistory: storeWeightHistory,
    weightGain: storeWeightGain,
    profile: storeProfile,
  } = useStudent(
    "progress",
    "user",
    "units",
    "gymLocations",
    "dayPasses",
    "workoutHistory",
    "weightHistory",
    "weightGain",
    "profile"
  );
  const { addDayPass } = useStudent("actions");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Usar dados do store com fallback para props (SSR)
  const displayProgress = {
    currentStreak:
      storeProgress?.currentStreak || initialProgress.currentStreak,
    longestStreak:
      storeProgress?.longestStreak || initialProgress.longestStreak,
    totalXP: storeProgress?.totalXP || initialProgress.totalXP,
    todayXP: storeProgress?.todayXP || initialProgress.todayXP,
    currentLevel:
      storeProgress?.currentLevel || profileData?.progress.currentLevel || 1,
    xpToNextLevel:
      storeProgress?.xpToNextLevel ?? profileData?.progress.xpToNextLevel ?? 0,
    workoutsCompleted:
      storeProgress?.workoutsCompleted ||
      profileData?.progress.workoutsCompleted ||
      0,
  };

  // Usar dados do store ou props
  const currentUnits = storeUnits && storeUnits.length > 0 ? storeUnits : units;
  const currentGymLocations =
    storeGymLocations && storeGymLocations.length > 0
      ? storeGymLocations
      : gymLocations;
  const currentDayPasses = storeDayPasses || [];
  const currentUser = storeUser || profileData?.userInfo;
  const currentWorkoutHistory =
    storeWorkoutHistory || profileData?.workoutHistory || [];
  const currentWeightHistory =
    storeWeightHistory || profileData?.weightHistory || [];
  const currentWeightGain = storeWeightGain ?? profileData?.weightGain ?? null;
  const currentWeight = storeProfile?.weight || profileData?.currentWeight;
  const currentRanking = profileData?.ranking; // TODO: Adicionar ao store

  const handleLessonSelect = (_lessonId: string) => {
    // Lesson selection handled by workout store
  };

  const handlePurchaseDayPass = (gymId: string) => {
    const gym = currentGymLocations.find((g: GymLocation) => g.id === gymId);
    if (!gym) return;

    const newPass = {
      id: `pass-${Date.now()}`,
      gymId: gym.id,
      gymName: gym.name,
      purchaseDate: new Date(),
      validDate: new Date(Date.now() + 86400000),
      price: gym.plans.daily,
      status: "active" as const,
      qrCode: `QR_${gym.id}_${Date.now()}`,
    };

    addDayPass(newPass);
    alert(`Diária comprada com sucesso! R$ ${gym.plans.daily.toFixed(2)}`);
  };

  return (
    <motion.div
      key={tab}
      initial={isMounted ? { opacity: 0 } : false}
      animate={isMounted ? { opacity: 1 } : false}
      transition={{ duration: 0.2 }}
      className="px-4 py-6"
      suppressHydrationWarning
    >
      {tab === "home" && (
        <div className="mx-auto max-w-2xl space-y-6">
          <FadeIn>
            <div className="text-center">
              <h1 className="mb-2 text-3xl font-bold text-duo-text">
                {currentUser?.name
                  ? `Olá, ${currentUser.name.split(" ")[0]}!`
                  : "Olá, Atleta!"}
              </h1>
              <p className="text-sm text-duo-gray-dark">
                Continue sua jornada fitness de hoje
              </p>
            </div>
          </FadeIn>

          {/* Cards de Estatísticas Principais */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <StatCardLarge
                icon={Flame}
                value={displayProgress.currentStreak}
                label="dias de sequência"
                subtitle={`Recorde: ${displayProgress.longestStreak || 0}`}
                iconColor="duo-orange"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <StatCardLarge
                icon={Zap}
                value={`${displayProgress.todayXP} XP`}
                label="ganho hoje"
                subtitle={`Total: ${displayProgress.totalXP || 0} XP`}
                iconColor="duo-yellow"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <StatCardLarge
                icon={Trophy}
                value={`#${displayProgress.currentLevel}`}
                label="nível atual"
                subtitle={
                  currentRanking !== null && currentRanking !== undefined
                    ? `Top ${currentRanking}% global`
                    : "Continue treinando"
                }
                iconColor="duo-blue"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <StatCardLarge
                icon={Dumbbell}
                value={displayProgress.workoutsCompleted}
                label="treinos completos"
                subtitle={
                  profileData?.weeklyWorkouts && profileData.weeklyWorkouts > 0
                    ? `+${profileData.weeklyWorkouts} esta semana`
                    : "Nenhum esta semana"
                }
                iconColor="duo-green"
              />
            </motion.div>
          </div>

          {/* Card de Progresso de Nível */}
          {storeProgress && (
            <WhileInView delay={0.3}>
              <LevelProgressCard
                currentLevel={storeProgress.currentLevel}
                totalXP={storeProgress.totalXP}
                xpToNextLevel={storeProgress.xpToNextLevel}
                ranking={currentRanking ?? null}
              />
            </WhileInView>
          )}

          {/* Card de Evolução de Peso */}
          {currentWeight && (
            <WhileInView delay={0.35}>
              <WeightProgressCard
                currentWeight={currentWeight}
                weightGain={currentWeightGain}
                hasWeightLossGoal={
                  storeProfile?.hasWeightLossGoal ||
                  profileData?.hasWeightLossGoal ||
                  false
                }
                weightHistory={currentWeightHistory}
              />
            </WhileInView>
          )}

          {/* Card de Treinos Recentes */}
          {currentWorkoutHistory.length > 0 && (
            <WhileInView delay={0.4}>
              <RecentWorkoutsCard workoutHistory={currentWorkoutHistory} />
            </WhileInView>
          )}

          {/* Personalização com IA */}
          <WhileInView delay={0.45}>
            <SectionCard
              icon={Heart}
              title="Personalização com IA"
              className="space-y-4"
            >
              <p className="text-sm text-duo-gray-dark">
                Crie treinos e dietas personalizados
              </p>
              <PersonalizationPage />
            </SectionCard>
          </WhileInView>

          {/* Loja de Recursos */}
          <WhileInView delay={0.5}>
            <ShopCard totalXP={displayProgress.totalXP} />
          </WhileInView>
        </div>
      )}

      {tab === "learn" && (
        <div className="pb-8" key="learn-tab">
          {currentUnits && currentUnits.length > 0 ? (
            <LearningPath
              key="learning-path"
              units={currentUnits}
              onLessonSelect={handleLessonSelect}
            />
          ) : (
            <div className="flex items-center justify-center p-8">
              <p className="text-duo-gray-dark">Carregando treinos...</p>
            </div>
          )}
        </div>
      )}

      {tab === "cardio" && <CardioFunctionalPage />}

      {tab === "diet" && <DietPage />}

      {tab === "payments" && (
        <StudentPaymentsPage
          subscription={subscription}
          startTrial={async () => {
            // Usar axios client (API → Zustand → Component)
            const { apiClient } = await import("@/lib/api/client");
            const response = await apiClient.post<{
              error?: string;
              success?: boolean;
            }>("/api/subscriptions/start-trial");
            return response.data;
          }}
        />
      )}

      {tab === "gyms" && (
        <GymMap
          gyms={currentGymLocations}
          dayPasses={currentDayPasses}
          onPurchaseDayPass={handlePurchaseDayPass}
        />
      )}

      {tab === "education" && (
        <>
          {educationView === "menu" &&
            !exerciseId &&
            !muscleId &&
            !lessonId && (
              <EducationPage
                onSelectView={(view) => {
                  setEducationView(view);
                }}
              />
            )}

          {(educationView === "muscles" || exerciseId || muscleId) && (
            <MuscleExplorer
              muscleId={muscleId || null}
              exerciseId={exerciseId || null}
              onMuscleSelect={(id) => setMuscleId(id)}
              onExerciseSelect={(id) => setExerciseId(id)}
              onBack={() => {
                setEducationView("menu");
                setMuscleId(null);
                setExerciseId(null);
              }}
            />
          )}

          {educationView === "lessons" && !exerciseId && !muscleId && (
            <EducationalLessons
              lessonId={lessonId || null}
              onLessonSelect={(id) => setLessonId(id)}
              onBack={() => {
                setEducationView("menu");
                setLessonId(null);
              }}
            />
          )}
        </>
      )}

      {tab === "profile" && profileData && (
        <ProfilePage
          progress={profileData.progress}
          workoutHistory={profileData.workoutHistory}
          personalRecords={profileData.personalRecords}
          weightHistory={profileData.weightHistory}
          userInfo={userInfo}
          profileUserInfo={profileData.userInfo}
          currentWeight={profileData.currentWeight}
          weightGain={profileData.weightGain}
          weeklyWorkouts={profileData.weeklyWorkouts}
          ranking={profileData.ranking}
          hasWeightLossGoal={profileData.hasWeightLossGoal}
        />
      )}

      {tab === "more" && <StudentMoreMenu />}
    </motion.div>
  );
}

export default function StudentHome({
  units,
  gymLocations,
  initialProgress,
  profileData,
  subscription,
  userInfo = { isAdmin: false, role: null },
}: StudentHomeContentProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          Carregando...
        </div>
      }
    >
      <StudentHomeContent
        units={units}
        gymLocations={gymLocations}
        initialProgress={initialProgress}
        profileData={profileData}
        subscription={subscription}
        userInfo={userInfo}
      />
    </Suspense>
  );
}
