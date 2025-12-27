"use client";

import { Suspense, useState, useEffect } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { useRouter } from "next/navigation";

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
import { Flame, Zap, Trophy, Dumbbell } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { WhileInView } from "@/components/animations/while-in-view";
import { motion } from "motion/react";
import { useStudent } from "@/hooks/use-student";
import { useLoadPrioritized } from "@/hooks/use-load-prioritized";
import { StatCardLarge } from "@/components/molecules/cards/stat-card-large";
import { SectionCard } from "@/components/molecules/cards/section-card";
import { ShopCard } from "@/components/organisms/sections/shop-card";
import { WeightProgressCard } from "@/components/organisms/home/home/weight-progress-card";
import { RecentWorkoutsCard } from "@/components/organisms/home/home/recent-workouts-card";
import { LevelProgressCard } from "@/components/organisms/home/home/level-progress-card";
import { ContinueWorkoutCard } from "@/components/organisms/home/home/continue-workout-card";
import { NutritionStatusCard } from "@/components/organisms/home/home/nutrition-status-card";
import { AdminOnly } from "@/components/admin/admin-only";
import {
  useAdminRouteGuard,
  shouldBlockRoute,
} from "@/lib/utils/admin-route-guard";
import type { GymLocation } from "@/lib/types";

/**
 * Componente de Conteúdo da Home do Student
 *
 * Arquitetura Offline-First:
 * - Usa apenas dados do store unificado (via useStudent hook)
 * - Não recebe props SSR (dados vêm do store)
 * - Funciona offline com dados em cache
 * - Sincronização automática via syncManager
 */

function StudentHomeContent() {
  // Carregamento prioritizado: progress, workoutHistory, profile aparecem primeiro
  // Se dados já existem no store, só carrega o que falta
  useLoadPrioritized({ context: "home" });

  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [tab] = useQueryState("tab", parseAsString.withDefault("home"));

  // Verificar se é admin
  const { isAdmin, role } = useStudent("isAdmin", "role");
  const userIsAdmin = isAdmin || role === "ADMIN";

  // Proteger rotas bloqueadas (versão beta)
  const blockedTabs = ["cardio", "gyms", "payments"];
  const isBlockedTab = tab && blockedTabs.includes(tab) && !userIsAdmin;

  // Redirecionar se tentar acessar rota bloqueada
  useEffect(() => {
    if (isBlockedTab) {
      // Redirecionar para home se tentar acessar rota bloqueada
      router.push("/student?tab=home");
    }
  }, [isBlockedTab, router]);
  const [educationView, setEducationView] = useQueryState(
    "view",
    parseAsString.withDefault("menu")
  );
  const [muscleId, setMuscleId] = useQueryState("muscle", parseAsString);
  const [exerciseId, setExerciseId] = useQueryState("exercise", parseAsString);
  const [lessonId, setLessonId] = useQueryState("lesson", parseAsString);

  // Garantir que quando há exerciseId, o view seja "muscles" para renderizar o MuscleExplorer
  useEffect(() => {
    if (exerciseId && educationView !== "muscles") {
      setEducationView("muscles");
    }
  }, [exerciseId, educationView, setEducationView]);

  // Debug: verificar se tab e exerciseId estão sendo lidos corretamente
  useEffect(() => {
    if (tab === "education") {
      console.log("[DEBUG] Education tab ativo:", {
        tab,
        educationView,
        exerciseId,
        muscleId,
      });
    }
  }, [tab, educationView, exerciseId, muscleId]);

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
    user: storeUser,
    gymLocations: storeGymLocations,
    dayPasses: storeDayPasses,
    workoutHistory: storeWorkoutHistory,
    weightHistory: storeWeightHistory,
    weightGain: storeWeightGain,
    profile: storeProfile,
    subscription: storeSubscription,
    personalRecords: storePersonalRecords,
    units: storeUnits,
    dailyNutrition: storeDailyNutrition,
    isAdmin: storeIsAdmin,
    role: storeRole,
  } = useStudent(
    "progress",
    "user",
    "gymLocations",
    "dayPasses",
    "workoutHistory",
    "weightHistory",
    "weightGain",
    "profile",
    "subscription",
    "personalRecords",
    "units",
    "dailyNutrition",
    "isAdmin",
    "role"
  );

  const { addDayPass } = useStudent("actions");
  const { loadSubscription } = useStudent("loaders");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ============================================
  // DADOS DISPLAY (Apenas do Store)
  // ============================================
  // Não usamos mais fallback para props SSR.
  // Todos os dados vêm do store unificado.
  // Se não houver dados ainda, o useStudentInitializer está carregando.

  const displayProgress = {
    currentStreak: storeProgress?.currentStreak || 0,
    longestStreak: storeProgress?.longestStreak || 0,
    totalXP: storeProgress?.totalXP || 0,
    todayXP: storeProgress?.todayXP || 0,
    currentLevel: storeProgress?.currentLevel || 1,
    xpToNextLevel: storeProgress?.xpToNextLevel || 100,
    workoutsCompleted: storeProgress?.workoutsCompleted || 0,
  };

  // Dados do store (sem fallback SSR)
  const currentGymLocations = storeGymLocations || [];
  const currentDayPasses = storeDayPasses || [];
  const currentUser = storeUser;
  const currentWorkoutHistory = storeWorkoutHistory || [];
  const currentWeightHistory = storeWeightHistory || [];
  const currentWeightGain = storeWeightGain ?? null;
  const currentWeight = storeProfile?.weight;
  const currentSubscription = storeSubscription;
  const currentPersonalRecords = storePersonalRecords || [];
  const currentRanking = null; // TODO: Adicionar ao store se necessário
  const userInfo = {
    isAdmin: storeIsAdmin || false,
    role: storeRole || null,
  };

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

          {/* Card de Progresso de Nível */}
          {storeProgress && (
            <WhileInView delay={0.4}>
              <LevelProgressCard
                currentLevel={storeProgress.currentLevel}
                totalXP={storeProgress.totalXP}
                xpToNextLevel={storeProgress.xpToNextLevel}
                ranking={currentRanking ?? null}
              />
            </WhileInView>
          )}

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
                  currentWorkoutHistory.length > 0
                    ? `${currentWorkoutHistory.length} treinos registrados`
                    : "Nenhum treino ainda"
                }
                iconColor="duo-green"
              />
            </motion.div>
          </div>

          {/* Card de Evolução de Peso */}
          {currentWeight && (
            <WhileInView delay={0.45}>
              <WeightProgressCard
                currentWeight={currentWeight}
                weightGain={currentWeightGain}
                hasWeightLossGoal={storeProfile?.hasWeightLossGoal || false}
                weightHistory={currentWeightHistory}
              />
            </WhileInView>
          )}

          {/* Card: Continue seu Treino */}
          <WhileInView delay={0.3}>
            <ContinueWorkoutCard
              units={storeUnits || []}
              workoutHistory={currentWorkoutHistory}
            />
          </WhileInView>

          {/* Card: Status de Nutrição */}
          <WhileInView delay={0.35}>
            <NutritionStatusCard dailyNutrition={storeDailyNutrition} />
          </WhileInView>

          {/* Card de Treinos Recentes */}
          {currentWorkoutHistory.length > 0 && (
            <WhileInView delay={0.5}>
              <RecentWorkoutsCard workoutHistory={currentWorkoutHistory} />
            </WhileInView>
          )}
        </div>
      )}

      {tab === "learn" && (
        <div className="pb-8" key="learn-tab">
          <LearningPath
            key="learning-path"
            onLessonSelect={handleLessonSelect}
          />
        </div>
      )}

      {tab === "cardio" && <CardioFunctionalPage />}

      {tab === "diet" && <DietPage />}

      {tab === "payments" && (
        <AdminOnly>
          <StudentPaymentsPage
            subscription={currentSubscription}
            startTrial={async () => {
              // Usar axios client (API → syncManager → Store)
              // syncManager gerencia offline/online automaticamente
              const { apiClient } = await import("@/lib/api/client");
              const response = await apiClient.post<{
                error?: string;
                success?: boolean;
              }>("/api/subscriptions/start-trial");
              // Após sucesso, recarregar subscription do store
              if (response.data.success) {
                await loadSubscription();
              }
              return response.data;
            }}
          />
        </AdminOnly>
      )}

      {tab === "gyms" && (
        <AdminOnly>
          <GymMap
            gyms={currentGymLocations}
            dayPasses={currentDayPasses}
            onPurchaseDayPass={handlePurchaseDayPass}
          />
        </AdminOnly>
      )}

      {(tab === "education" || exerciseId) && (
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

      {tab === "profile" && <ProfilePage />}

      {tab === "more" && <StudentMoreMenu />}
    </motion.div>
  );
}

export default function StudentHome() {
  // Componente wrapper que não recebe mais props SSR
  // Todos os dados vêm do store unificado via useStudent hook
  // useStudentInitializer no layout carrega tudo automaticamente

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-duo-gray-dark">Carregando dados...</p>
            <p className="mt-2 text-sm text-duo-gray">
              Dados sendo carregados do cache ou servidor
            </p>
          </div>
        </div>
      }
    >
      <StudentHomeContent />
    </Suspense>
  );
}
