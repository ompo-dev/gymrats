"use client";

import { Dumbbell, Flame, Trophy, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useEffect, useState } from "react";
import { CardioFunctionalPage } from "@/app/student/_cardio/cardio-functional-page";
import { PixQrModal } from "@/components/organisms/modals/pix-qr-modal";
import { apiClient } from "@/lib/api/client";
import { DietPage } from "@/app/student/_diet/diet-page";
import { GymProfileView } from "@/app/student/_gyms/gym-profile-view";
import { LearningPath } from "@/app/student/_learn/learning-path";
import { StudentMoreMenu } from "@/app/student/_more/student-more-menu";
import {
  StudentPaymentsPage,
  type StudentPaymentsPageProps,
} from "@/app/student/_payments/student-payments-page";
import { ProfilePage } from "@/app/student/_profile/profile-page";
import { FadeIn } from "@/components/animations/fade-in";
import { WhileInView } from "@/components/animations/while-in-view";
import { DuoStatCard, DuoStatsGrid } from "@/components/duo";
import { EducationPage } from "@/components/organisms/education/education-page";
import { EducationalLessons } from "@/components/organisms/education/educational-lessons";
import { MuscleExplorer } from "@/components/organisms/education/muscle-explorer";
import { BoostCampaignCarousel } from "@/components/organisms/home/home/boost-campaign-carousel";
import { ContinueWorkoutCard } from "@/components/organisms/home/home/continue-workout-card";
import { LevelProgressCard } from "@/components/organisms/home/home/level-progress-card";
import { NutritionStatusCard } from "@/components/organisms/home/home/nutrition-status-card";
import { RecentWorkoutsCard } from "@/components/organisms/home/home/recent-workouts-card";
import { WeightProgressCard } from "@/components/organisms/home/home/weight-progress-card";
import { GymMap } from "@/components/organisms/sections/gym-map";
import { useLoadPrioritized } from "@/hooks/use-load-prioritized";
import { useStudent } from "@/hooks/use-student";
import { useToast } from "@/hooks/use-toast";
import { useUserSession } from "@/hooks/use-user-session";
import type {
  DailyNutrition,
  DayPass,
  GymLocation,
  PlanSlotData,
  StudentGymMembership,
  SubscriptionData,
  Unit,
  UserProgress,
  WeeklyPlanData,
  WeightHistoryItem,
  WorkoutHistory,
} from "@/lib/types";
import type { StudentProfileData, UserInfo } from "@/lib/types/student-unified";

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
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("home"));
  const [gymId, setGymId] = useQueryState("gymId", parseAsString);

  // ✅ SEGURO: Verificar se é admin validando no servidor
  const { isAdmin, role, isLoading: isSessionLoading } = useUserSession();
  const userIsAdmin = isAdmin || role === "ADMIN";

  // Redirecionar se a sessão ainda estiver carregando
  useEffect(() => {
    if (isSessionLoading) return;
  }, [isSessionLoading]);
  const [educationView, setEducationView] = useQueryState(
    "view",
    parseAsString.withDefault("menu"),
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

  // Debug: verificar se tab e exerciseId estão sendo lidos corretamente (apenas em dev)
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && tab === "education") {
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
    memberships: storeMemberships,
    workoutHistory: storeWorkoutHistory,
    weightHistory: storeWeightHistory,
    weightGain: storeWeightGain,
    profile: storeProfile,
    subscription: storeSubscription,
    personalRecords: storePersonalRecords,
    units: storeUnits,
    weeklyPlan: storeWeeklyPlan,
    dailyNutrition: storeDailyNutrition,
    isAdmin: storeIsAdmin,
    role: storeRole,
  } = useStudent(
    "progress",
    "user",
    "gymLocations",
    "dayPasses",
    "memberships",
    "workoutHistory",
    "weightHistory",
    "weightGain",
    "profile",
    "subscription",
    "personalRecords",
    "units",
    "weeklyPlan",
    "dailyNutrition",
    "isAdmin",
    "role",
  );

  const { addDayPass } = useStudent("actions");
  const { loadSubscription, loadMemberships, loadPayments } =
    useStudent("loaders");
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ============================================
  // DADOS DISPLAY (Apenas do Store)
  // ============================================
  // Não usamos mais fallback para props SSR.
  // Todos os dados vêm do store unificado.
  // Se não houver dados ainda, o useStudentInitializer está carregando.

  const progress = storeProgress as unknown as UserProgress | null;
  const displayProgress = {
    currentStreak: progress?.currentStreak ?? 0,
    longestStreak: progress?.longestStreak ?? 0,
    totalXP: progress?.totalXP ?? 0,
    todayXP: progress?.todayXP ?? 0,
    currentLevel: progress?.currentLevel ?? 1,
    xpToNextLevel: progress?.xpToNextLevel ?? 100,
    workoutsCompleted: progress?.workoutsCompleted ?? 0,
  };

  // Dados do store (sem fallback SSR) — cast do persist (JsonValue) para tipos do domínio
  const currentGymLocations = (storeGymLocations ??
    []) as unknown as GymLocation[];
  const currentDayPasses = (storeDayPasses ?? []) as unknown as DayPass[];
  const currentMemberships = (storeMemberships ??
    []) as unknown as StudentGymMembership[];
  const currentUser = storeUser as unknown as UserInfo | null;
  const currentWorkoutHistory = (storeWorkoutHistory ??
    []) as unknown as WorkoutHistory[];
  const currentWeightHistory = (storeWeightHistory ??
    []) as unknown as WeightHistoryItem[];
  const currentWeightGain = (storeWeightGain ?? null) as number | null;
  const profile = storeProfile as unknown as StudentProfileData | null;
  const currentWeight = profile?.weight;
  const currentSubscription =
    storeSubscription as unknown as SubscriptionData | null;
  const _currentPersonalRecords = storePersonalRecords || [];
  const _userInfo = {
    isAdmin: storeIsAdmin || false,
    role: storeRole || null,
  };

  const handleLessonSelect = (_lessonId: string) => {
    // Lesson selection handled by workout store
  };

  const [pixModal, setPixModal] = useState<{
    open: boolean;
    paymentId: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    planName?: string;
    originalPrice?: number;
    appliedCoupon?: { code: string; discountString: string };
  } | null>(null);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  const handleJoinGym = async (
    gymId: string,
    planId: string,
    couponId?: string,
  ) => {
    try {
      const { apiClient } = await import("@/lib/api/client");
      const res = await apiClient.post<{
        brCode?: string;
        brCodeBase64?: string;
        amount?: number;
        paymentId?: string;
        membershipId?: string;
        success?: boolean;
        planName?: string;
        originalPrice?: number;
        appliedCoupon?: { code: string; discountString: string };
      }>(`/api/students/gyms/${gymId}/join`, {
        planId,
        couponId: couponId || null,
      });
      const data = res?.data ?? {};
      const hasPixData =
        data.paymentId &&
        data.brCode != null &&
        data.brCodeBase64 != null &&
        typeof data.amount === "number" &&
        data.amount > 0;
      if (hasPixData) {
        setPixModal({
          open: true,
          paymentId: data.paymentId!,
          brCode: data.brCode!,
          brCodeBase64: data.brCodeBase64!,
          amount: data.amount!,
          planName: data.planName,
          originalPrice: data.originalPrice,
          appliedCoupon: data.appliedCoupon,
        });
      } else {
        toast({
          title: "Mensalidade criada",
          description:
            "Acesse a aba Pagamentos para gerar o PIX e concluir o pagamento.",
        });
        await handlePixConfirmed();
      }
    } catch (err) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao contratar";
      toast({
        variant: "destructive",
        title: "Erro",
        description: String(msg),
      });
    }
  };

  const handleChangePlan = async (membershipId: string, planId: string) => {
    try {
      const { apiClient } = await import("@/lib/api/client");
      const res = await apiClient.post<{
        brCode: string;
        brCodeBase64: string;
        amount: number;
        paymentId: string;
      }>(`/api/students/memberships/${membershipId}/change-plan`, { planId });
      setPixModal({
        open: true,
        paymentId: res.data.paymentId,
        brCode: res.data.brCode,
        brCodeBase64: res.data.brCodeBase64,
        amount: res.data.amount,
      });
    } catch (err) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao trocar de plano";
      toast({
        variant: "destructive",
        title: "Erro",
        description: String(msg),
      });
    }
  };

  const [preSelectedPlan, setPreSelectedPlan] = useQueryState(
    "planId",
    parseAsString,
  );
  const [preSelectedCoupon, setPreSelectedCoupon] = useQueryState(
    "couponId",
    parseAsString,
  );

  const handleViewGymProfile = (
    id: string,
    planId?: string,
    couponId?: string,
  ) => {
    setTab("gyms");
    setGymId(id);
    setPreSelectedPlan(planId || null);
    setPreSelectedCoupon(couponId || null);
  };

  const handleCancelMembership = async (membershipId: string) => {
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.post(
        `/api/students/memberships/${membershipId}/cancel`,
        {},
      );
      toast({
        title: "Assinatura cancelada",
        description: "Sua matrícula nesta academia foi cancelada.",
      });
      await loadMemberships();
      setProfileRefreshKey((k) => k + 1);
    } catch (err) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao cancelar";
      toast({
        variant: "destructive",
        title: "Erro",
        description: String(msg),
      });
    }
  };

  const handlePixConfirmed = async () => {
    await Promise.all([loadMemberships(), loadPayments()]);
    setProfileRefreshKey((k) => k + 1);
  };

  const handlePurchaseDayPass = (gymId: string) => {
    const gym = currentGymLocations.find((g: GymLocation) => g.id === gymId);
    if (!gym || !gym.plans?.daily || gym.plans.daily <= 0) return;

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
    toast({
      title: "Diária comprada",
      description: `R$ ${gym.plans.daily.toFixed(2)} – válido por 24h`,
      variant: "default",
    });
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

          {/* Anúncios de Academias (Boost Campaigns) */}
          <WhileInView delay={0.3}>
            <BoostCampaignCarousel
              gyms={currentGymLocations}
              onViewGymProfile={handleViewGymProfile}
            />
          </WhileInView>

          {/* Card de Progresso de Nível */}
          {progress && (
            <WhileInView delay={0.4}>
              <LevelProgressCard.Simple
                currentLevel={progress.currentLevel}
                totalXP={progress.totalXP}
                xpToNextLevel={progress.xpToNextLevel}
              />
            </WhileInView>
          )}

          {/* Cards de Estatísticas Principais */}
          <DuoStatsGrid.Root columns={2} className="gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <DuoStatCard.Simple
                icon={Flame}
                value={displayProgress.currentStreak}
                label="dias de sequência"
                badge={`Recorde: ${displayProgress.longestStreak || 0}`}
                iconColor="var(--duo-accent)"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <DuoStatCard.Simple
                icon={Zap}
                value={`${displayProgress.todayXP} XP`}
                label="ganho hoje"
                badge={`Total: ${displayProgress.totalXP || 0} XP`}
                iconColor="var(--duo-warning)"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <DuoStatCard.Simple
                icon={Trophy}
                value={`#${displayProgress.currentLevel}`}
                label="nível atual"
                badge="Continue treinando"
                iconColor="var(--duo-secondary)"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <DuoStatCard.Simple
                icon={Dumbbell}
                value={displayProgress.workoutsCompleted}
                label="treinos completos"
                badge={
                  currentWorkoutHistory.length > 0
                    ? `${currentWorkoutHistory.length} treinos registrados`
                    : "Nenhum treino ainda"
                }
                iconColor="var(--duo-primary)"
              />
            </motion.div>
          </DuoStatsGrid.Root>

          {/* Card de Evolução de Peso */}
          {currentWeight != null && (
            <WhileInView delay={0.45}>
              <WeightProgressCard.Simple
                currentWeight={currentWeight}
                weightGain={currentWeightGain}
                hasWeightLossGoal={profile?.hasWeightLossGoal ?? false}
                weightHistory={currentWeightHistory}
              />
            </WhileInView>
          )}

          {/* Card: Continue seu Treino */}
          <WhileInView delay={0.3}>
            <ContinueWorkoutCard.Simple
              units={
                (storeWeeklyPlan as unknown as WeeklyPlanData | null)?.slots
                  ? ([
                      {
                        id: (storeWeeklyPlan as unknown as WeeklyPlanData).id,
                        title: (storeWeeklyPlan as unknown as WeeklyPlanData)
                          .title,
                        description: "",
                        workouts: (
                          storeWeeklyPlan as unknown as WeeklyPlanData
                        ).slots
                          .filter(
                            (s: PlanSlotData) =>
                              s.type === "workout" && s.workout,
                          )
                          .map((s: PlanSlotData) => s.workout!),
                        color: "#58CC02",
                        icon: "💪",
                      },
                    ] as Unit[])
                  : ((storeUnits ?? []) as unknown as Unit[])
              }
              workoutHistory={currentWorkoutHistory}
            />
          </WhileInView>

          {/* Card: Status de Nutrição */}
          <WhileInView delay={0.35}>
            <NutritionStatusCard.Simple
              dailyNutrition={
                (storeDailyNutrition ??
                  null) as unknown as DailyNutrition | null
              }
            />
          </WhileInView>

          {/* Card de Treinos Recentes */}
          {currentWorkoutHistory.length > 0 && (
            <WhileInView delay={0.5}>
              <RecentWorkoutsCard.Simple
                workoutHistory={currentWorkoutHistory}
              />
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
        <StudentPaymentsPage
          subscription={
            (currentSubscription ??
              undefined) as StudentPaymentsPageProps["subscription"]
          }
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
      )}

      {tab === "gyms" &&
        (gymId ? (
          <GymProfileView
            gymId={gymId}
            onBack={() => {
              setGymId(null);
              setPreSelectedPlan(null);
              setPreSelectedCoupon(null);
            }}
            onJoinPlan={handleJoinGym}
            onChangePlan={handleChangePlan}
            onCancelMembership={handleCancelMembership}
            profileRefreshKey={profileRefreshKey}
            preSelectedPlan={preSelectedPlan}
            preSelectedCoupon={preSelectedCoupon}
          />
        ) : (
          <GymMap.Simple
            gyms={currentGymLocations}
            dayPasses={currentDayPasses}
            memberships={currentMemberships}
            onPurchaseDayPass={handlePurchaseDayPass}
            onJoinPlan={handleJoinGym}
            onChangePlan={handleChangePlan}
            onViewGymProfile={handleViewGymProfile}
          />
        ))}

      {pixModal && (
        <PixQrModal
          isOpen={pixModal.open}
          onClose={() => setPixModal(null)}
          brCode={pixModal.brCode}
          brCodeBase64={pixModal.brCodeBase64}
          amount={pixModal.amount}
          valueSlot={
            pixModal.planName
              ? {
                  label: `Assinatura: ${pixModal.planName}`,
                  strikethrough: pixModal.originalPrice,
                  badge: pixModal.appliedCoupon,
                }
              : undefined
          }
          simulatePixUrl={`/api/students/payments/${pixModal.paymentId}/simulate-pix`}
          onSimulateSuccess={handlePixConfirmed}
          pollConfig={{
            type: "check",
            check: async () => {
              const res = await apiClient.get<{ status: string }>(
                `/api/payments/${pixModal.paymentId}`,
              );
              return res.data.status === "paid";
            },
          }}
          onPaymentConfirmed={handlePixConfirmed}
          paymentConfirmedToast={{
            title: "Pagamento confirmado!",
            description: "Sua mensalidade está ativa.",
          }}
        />
      )}

      {(tab === "education" || exerciseId) && (
        <>
          {educationView === "menu" &&
            !exerciseId &&
            !muscleId &&
            !lessonId && (
              <EducationPage.Simple
                onSelectView={(view) => {
                  setEducationView(view);
                }}
              />
            )}

          {(educationView === "muscles" || exerciseId || muscleId) && (
            <MuscleExplorer.Simple
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
            <EducationalLessons.Simple
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
