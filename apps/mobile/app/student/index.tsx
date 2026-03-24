import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SecondaryButton } from "../../src/components/buttons";
import { NativeLoadingScreen } from "../../src/components/native-loading-screen";
import { ScreenBackground } from "../../src/components/screen-background";
import {
  activateStudentLibraryPlan,
  applyStudentSubscriptionReferral,
  cancelStudentMembership,
  cancelStudentPersonalAssignment,
  cancelStudentPayment,
  cancelStudentSubscription,
  changeStudentMembershipPlan,
  completeStudentWorkout,
  createStudentLibraryPlan,
  createStudentSubscription,
  createStudentWeeklyPlan,
  createStudentWorkout,
  createStudentWorkoutExercise,
  deleteStudentLibraryPlan,
  deleteStudentWorkout,
  deleteStudentWorkoutExercise,
  fetchStudentAssignedPersonals,
  fetchStudentGymProfile,
  fetchStudentLibraryPlanDetail,
  fetchStudentPersonalDirectory,
  fetchStudentPersonalProfile,
  fetchStudentWorkoutProgress,
  generateStudentWorkouts,
  joinStudentGym,
  payStudentPayment,
  requestStudentReferralWithdraw,
  resetStudentWeek,
  saveStudentWorkoutProgress,
  simulateStudentPayment,
  simulateStudentPersonalPayment,
  simulateStudentSubscriptionPix,
  startStudentTrial,
  subscribeStudentToPersonal,
  updateStudentLibraryPlan,
  updateStudentReferralPixKey,
  updateStudentWeeklyPlan,
  updateStudentWorkout,
  updateStudentWorkoutExercise,
} from "../../src/features/student/api";
import { StudentCardioScreen } from "../../src/features/student/student-cardio-screen";
import { StudentDietScreen } from "../../src/features/student/student-diet-screen";
import { StudentEducationScreen } from "../../src/features/student/student-education-screen";
import { StudentGymsScreen } from "../../src/features/student/student-gyms-screen";
import { StudentHomeScreen } from "../../src/features/student/student-home-screen";
import { StudentLearnScreen } from "../../src/features/student/student-learn-screen";
import { StudentMoreScreen } from "../../src/features/student/student-more-screen";
import { StudentPaymentsScreen } from "../../src/features/student/student-payments-screen";
import { StudentPlanEditorScreen } from "../../src/features/student/student-plan-editor-screen";
import { StudentPersonalsScreen } from "../../src/features/student/student-personals-screen";
import { StudentProfileScreen } from "../../src/features/student/student-profile-screen";
import {
  StudentBottomNav,
  StudentHeader,
  StudentStatsRibbon,
} from "../../src/features/student/student-shell";
import { StudentWebTabFallback } from "../../src/features/student/student-web-tab-fallback";
import { StudentWorkoutScreen } from "../../src/features/student/student-workout-screen";
import { hasCompletedStudentProfile } from "../../src/features/student/profile-completion";
import { useStudentHomeStore } from "../../src/features/student/store";
import type {
  BoostCampaign,
  StudentBottomTab,
} from "../../src/features/student/types";
import { useAppStore } from "../../src/store/app-store";
import { colors, spacing, typography } from "../../src/theme";

type StudentRouteTab =
  | StudentBottomTab
  | "cardio"
  | "education"
  | "gyms"
  | "payments"
  | "personals";

const VALID_STUDENT_ROUTE_TABS = new Set<StudentRouteTab>([
  "home",
  "learn",
  "diet",
  "profile",
  "more",
  "cardio",
  "education",
  "gyms",
  "payments",
  "personals",
]);

function normalizeStudentRouteTab(
  value: string | string[] | undefined,
): StudentRouteTab {
  const normalized = Array.isArray(value) ? value[0] : value;

  if (
    normalized &&
    VALID_STUDENT_ROUTE_TABS.has(normalized as StudentRouteTab)
  ) {
    return normalized as StudentRouteTab;
  }

  return "home";
}

function getActiveBottomTab(tab: StudentRouteTab): StudentBottomTab {
  if (tab === "cardio" || tab === "education") {
    return "learn";
  }

  if (tab === "gyms" || tab === "payments" || tab === "personals") {
    return "more";
  }

  return tab;
}

export default function StudentScreen() {
  const params = useLocalSearchParams();
  const config = useAppStore((state) => state.config);
  const session = useAppStore((state) => state.session);
  const hydrated = useAppStore((state) => state.hydrated);
  const clearSession = useAppStore((state) => state.clearSession);
  const data = useStudentHomeStore((state) => state.data);
  const loading = useStudentHomeStore((state) => state.loading);
  const refreshing = useStudentHomeStore((state) => state.refreshing);
  const error = useStudentHomeStore((state) => state.error);
  const load = useStudentHomeStore((state) => state.load);
  const trackClick = useStudentHomeStore((state) => state.trackClick);
  const addWeight = useStudentHomeStore((state) => state.addWeight);
  const saveNutrition = useStudentHomeStore((state) => state.saveNutrition);
  const reset = useStudentHomeStore((state) => state.reset);

  const routeTab = useMemo(
    () => normalizeStudentRouteTab(params.tab),
    [params.tab],
  );
  const webMode = useMemo(() => {
    const rawMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
    return rawMode === "web";
  }, [params.mode]);
  const requestedWorkoutId = useMemo(() => {
    return Array.isArray(params.workoutId) ? params.workoutId[0] : params.workoutId;
  }, [params.workoutId]);
  const requestedPersonalId = useMemo(() => {
    return Array.isArray(params.personalId) ? params.personalId[0] : params.personalId;
  }, [params.personalId]);
  const requestedPlanId = useMemo(() => {
    return Array.isArray(params.planId) ? params.planId[0] : params.planId;
  }, [params.planId]);
  const requestedEditor = useMemo(() => {
    return Array.isArray(params.editor) ? params.editor[0] : params.editor;
  }, [params.editor]);
  const requestedCouponId = useMemo(() => {
    return Array.isArray(params.couponId) ? params.couponId[0] : params.couponId;
  }, [params.couponId]);
  const requestedGymId = useMemo(() => {
    return Array.isArray(params.gymId) ? params.gymId[0] : params.gymId;
  }, [params.gymId]);
  const activeBottomTab = useMemo(
    () => getActiveBottomTab(routeTab),
    [routeTab],
  );
  const canUseNativeStudent =
    Boolean(session.token) &&
    (session.user?.role === "STUDENT" || session.user?.role === "ADMIN");

  const navigateToStudentTab = useCallback(
    (tab: StudentRouteTab, extraParams?: Record<string, string>) => {
      if (tab === "home" && !extraParams) {
        router.replace("/student");
        return;
      }

      router.replace({
        pathname: "/student",
        params: {
          tab,
          ...extraParams,
        },
      });
    },
    [],
  );

  useEffect(() => {
    if (!session.token || !canUseNativeStudent) {
      reset();
      return;
    }

    void load({
      apiUrl: config.apiUrl,
      token: session.token,
    });
  }, [canUseNativeStudent, config.apiUrl, load, reset, session.token]);

  useEffect(() => {
    if (session.user?.role !== "STUDENT" || !data) {
      return;
    }

    if (!hasCompletedStudentProfile(data.profile)) {
      router.replace("/student/onboarding");
    }
  }, [data, session.user?.role]);

  const handleRefresh = useCallback(() => {
    if (!session.token) {
      return;
    }

    void load({
      apiUrl: config.apiUrl,
      token: session.token,
      force: true,
    });
  }, [config.apiUrl, load, session.token]);

  const reloadStudentData = useCallback(async () => {
    if (!session.token) {
      return;
    }

    await load({
      apiUrl: config.apiUrl,
      token: session.token,
      force: true,
    });
  }, [config.apiUrl, load, session.token]);

  const handleCampaignOpen = useCallback(
    async (campaign: BoostCampaign) => {
      await trackClick({
        apiUrl: config.apiUrl,
        campaignId: campaign.id,
      });

      const extraParams: Record<string, string> = {};

      if (campaign.linkedPlanId) {
        extraParams.planId = campaign.linkedPlanId;
      }

      if (campaign.linkedCouponId) {
        extraParams.couponId = campaign.linkedCouponId;
      }

      if (campaign.personalId) {
        navigateToStudentTab("personals", {
          ...extraParams,
          personalId: campaign.personalId,
        });
        return;
      }

      if (campaign.gymId) {
        navigateToStudentTab("gyms", {
          ...extraParams,
          gymId: campaign.gymId,
        });
        return;
      }

      void Linking.openURL(`${config.webUrl}/student`);
    },
    [config.apiUrl, config.webUrl, navigateToStudentTab, trackClick],
  );

  const handleLogout = useCallback(() => {
    void clearSession();
    router.replace("/web");
  }, [clearSession]);

  const handleSwitchToGym = useCallback(() => {
    router.replace({
      pathname: "/web",
      params: {
        path: "/gym",
      },
    });
  }, []);

  if (!hydrated) {
    return <NativeLoadingScreen message="Preparando experiencia do aluno..." />;
  }

  if (session.token && session.user?.role === "PENDING") {
    return <Redirect href="/student/onboarding" />;
  }

  if (!canUseNativeStudent) {
    return <Redirect href="/web" />;
  }

  if ((loading && !data) || !session.token) {
    return <NativeLoadingScreen message="Carregando modulo student..." />;
  }

  const streak = data?.progress?.currentStreak ?? 0;
  const totalXP = data?.progress?.totalXP ?? 0;

  return (
    <ScreenBackground>
      <SafeAreaView
        edges={["top", "left", "right", "bottom"]}
        style={styles.container}
      >
        <StudentHeader />
        <StudentStatsRibbon streak={streak} xp={totalXP} />

        <View style={styles.content}>
          {!data && error ? (
            <View style={styles.errorState}>
              <Text style={styles.errorTitle}>
                Nao foi possivel carregar o aluno
              </Text>
              <Text style={styles.errorDescription}>{error}</Text>
              <SecondaryButton
                onPress={handleRefresh}
                title="Tentar novamente"
              />
            </View>
          ) : null}

          {data ? (
            <>
              {routeTab === "home" ? (
                <StudentHomeScreen
                  data={data}
                  onOpenCampaign={handleCampaignOpen}
                  onOpenTab={(tab) => navigateToStudentTab(tab)}
                  onRefresh={handleRefresh}
                  refreshing={refreshing}
                />
              ) : null}

              {routeTab === "learn" && !webMode && requestedWorkoutId ? (
                <StudentWorkoutScreen
                  data={data}
                  onBack={() => navigateToStudentTab("learn")}
                  onComplete={async (payload) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await completeStudentWorkout({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      workoutId: payload.workoutId,
                      exerciseLogs: payload.exerciseLogs,
                      duration: payload.duration,
                      totalVolume: payload.totalVolume,
                      startTime: payload.startTime,
                    });
                    await reloadStudentData();
                  }}
                  onLoadProgress={async (workoutId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    return fetchStudentWorkoutProgress({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      workoutId,
                    });
                  }}
                  onSaveProgress={async (payload) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await saveStudentWorkoutProgress({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      workoutId: payload.workoutId,
                      currentExerciseIndex: payload.currentExerciseIndex,
                      exerciseLogs: payload.exerciseLogs,
                      skippedExercises: payload.skippedExercises,
                      selectedAlternatives: payload.selectedAlternatives,
                      totalVolume: payload.totalVolume,
                      completionPercentage: payload.completionPercentage,
                      startTime: payload.startTime,
                    });
                  }}
                  workoutId={requestedWorkoutId}
                />
              ) : null}

              {routeTab === "learn" &&
              !webMode &&
              !requestedWorkoutId &&
              requestedEditor === "weekly" ? (
                <StudentPlanEditorScreen
                  activeSourcePlanId={data.weeklyPlan?.sourceLibraryPlanId ?? null}
                  kind="weekly"
                  onBack={() => navigateToStudentTab("learn")}
                  onCreateWeeklyPlan={async () => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await createStudentWeeklyPlan({
                      apiUrl: config.apiUrl,
                      token: session.token,
                    });
                    await reloadStudentData();
                  }}
                  onCreateWorkout={async (payload) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    const workoutId = await createStudentWorkout({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      ...payload,
                    });
                    await reloadStudentData();
                    return workoutId;
                  }}
                  onCreateWorkoutExercise={async (payload) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await createStudentWorkoutExercise({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      ...payload,
                    });
                    await reloadStudentData();
                  }}
                  onDeleteWorkout={async (workoutId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await deleteStudentWorkout({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      workoutId,
                    });
                    await reloadStudentData();
                  }}
                  onDeleteWorkoutExercise={async (exerciseId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await deleteStudentWorkoutExercise({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      exerciseId,
                    });
                    await reloadStudentData();
                  }}
                  onRefreshParent={reloadStudentData}
                  onResetWeeklyPlan={async () => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await resetStudentWeek({
                      apiUrl: config.apiUrl,
                      token: session.token,
                    });
                    await reloadStudentData();
                  }}
                  onUpdateWeeklyPlan={async (payload) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await updateStudentWeeklyPlan({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      ...payload,
                    });
                    await reloadStudentData();
                  }}
                  onUpdateWorkout={async (payload) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await updateStudentWorkout({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      ...payload,
                    });
                    await reloadStudentData();
                  }}
                  onUpdateWorkoutExercise={async (payload) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await updateStudentWorkoutExercise({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      ...payload,
                    });
                    await reloadStudentData();
                  }}
                  plan={data.weeklyPlan}
                />
              ) : null}

              {routeTab === "learn" &&
              !webMode &&
              !requestedWorkoutId &&
              requestedEditor === "library" &&
              requestedPlanId ? (
                <StudentPlanEditorScreen
                  activeSourcePlanId={data.weeklyPlan?.sourceLibraryPlanId ?? null}
                  kind="library"
                  onActivateLibraryPlan={async (libraryPlanId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await activateStudentLibraryPlan({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      libraryPlanId,
                    });
                    await reloadStudentData();
                  }}
                  onBack={() => navigateToStudentTab("learn")}
                  onCreateWorkout={async (payload) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    const workoutId = await createStudentWorkout({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      ...payload,
                    });
                    await reloadStudentData();
                    return workoutId;
                  }}
                  onCreateWorkoutExercise={async (payload) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await createStudentWorkoutExercise({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      ...payload,
                    });
                    await reloadStudentData();
                  }}
                  onDeleteLibraryPlan={async (planId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await deleteStudentLibraryPlan({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      planId,
                    });
                    await reloadStudentData();
                  }}
                  onDeleteWorkout={async (workoutId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await deleteStudentWorkout({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      workoutId,
                    });
                    await reloadStudentData();
                  }}
                  onDeleteWorkoutExercise={async (exerciseId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await deleteStudentWorkoutExercise({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      exerciseId,
                    });
                    await reloadStudentData();
                  }}
                  onFetchLibraryPlan={async (planId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    return fetchStudentLibraryPlanDetail({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      planId,
                    });
                  }}
                  onRefreshParent={reloadStudentData}
                  onUpdateLibraryPlan={async (payload) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await updateStudentLibraryPlan({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      ...payload,
                    });
                    await reloadStudentData();
                  }}
                  onUpdateWorkout={async (payload) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await updateStudentWorkout({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      ...payload,
                    });
                    await reloadStudentData();
                  }}
                  onUpdateWorkoutExercise={async (payload) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await updateStudentWorkoutExercise({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      ...payload,
                    });
                    await reloadStudentData();
                  }}
                  plan={null}
                  planId={requestedPlanId}
                />
              ) : null}

              {routeTab === "learn" &&
              !webMode &&
              !requestedWorkoutId &&
              !requestedEditor ? (
                <StudentLearnScreen
                  onActivateLibraryPlan={async (libraryPlanId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await activateStudentLibraryPlan({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      libraryPlanId,
                    });
                    await reloadStudentData();
                  }}
                  onCreateLibraryPlan={async () => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    const response = await createStudentLibraryPlan({
                      apiUrl: config.apiUrl,
                      token: session.token,
                    });
                    await reloadStudentData();

                    const planId = response.data?.id;
                    if (planId) {
                      navigateToStudentTab("learn", {
                        editor: "library",
                        planId,
                      });
                    }
                  }}
                  onCreateWeeklyPlan={async () => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await createStudentWeeklyPlan({
                      apiUrl: config.apiUrl,
                      token: session.token,
                    });
                    await reloadStudentData();
                    navigateToStudentTab("learn", {
                      editor: "weekly",
                    });
                  }}
                  data={data}
                  onGeneratePlan={async () => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await generateStudentWorkouts({
                      apiUrl: config.apiUrl,
                      token: session.token,
                    });
                    await reloadStudentData();
                  }}
                  onOpenLibraryPlan={(libraryPlanId) =>
                    navigateToStudentTab("learn", {
                      editor: "library",
                      planId: libraryPlanId,
                    })
                  }
                  onOpenWeeklyPlanEditor={() =>
                    navigateToStudentTab("learn", {
                      editor: "weekly",
                    })
                  }
                  onOpenWorkout={(workoutId) =>
                    router.replace({
                      pathname: "/student",
                      params: {
                        tab: "learn",
                        workoutId,
                      },
                    })
                  }
                  onRefresh={handleRefresh}
                  refreshing={refreshing}
                />
              ) : null}

              {routeTab === "diet" && !webMode ? (
                <StudentDietScreen
                  data={data}
                  onRefresh={handleRefresh}
                  onSaveNutrition={async (nutrition) => {
                    if (!session.token) {
                      return;
                    }

                    await saveNutrition({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      nutrition,
                    });
                  }}
                  refreshing={refreshing}
                />
              ) : null}

              {routeTab === "more" ? (
                <StudentMoreScreen
                  isAdmin={session.user?.role === "ADMIN"}
                  onNavigate={(tab, extraParams) =>
                    navigateToStudentTab(tab, extraParams)
                  }
                />
              ) : null}

              {routeTab === "payments" && !webMode ? (
                <StudentPaymentsScreen
                  data={data}
                  initialTab={Array.isArray(params.subTab) ? params.subTab[0] : params.subTab}
                  onApplySubscriptionReferral={async (referralCode) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    const payload = await applyStudentSubscriptionReferral({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      referralCode,
                    });
                    await reloadStudentData();
                    return payload;
                  }}
                  onCancelPayment={async (paymentId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await cancelStudentPayment({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      paymentId,
                    });
                    await reloadStudentData();
                  }}
                  onCancelSubscription={async () => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await cancelStudentSubscription({
                      apiUrl: config.apiUrl,
                      token: session.token,
                    });
                    await reloadStudentData();
                  }}
                  onCreateSubscription={async (plan, referralCode) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    const payload = await createStudentSubscription({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      plan,
                      referralCode,
                    });
                    await reloadStudentData();
                    return payload;
                  }}
                  onPayNow={async (paymentId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    return payStudentPayment({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      paymentId,
                    });
                  }}
                  onRefresh={handleRefresh}
                  onRequestWithdraw={async (amountCents) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await requestStudentReferralWithdraw({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      amountCents,
                    });
                    await reloadStudentData();
                  }}
                  onSimulatePayment={async (paymentId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await simulateStudentPayment({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      paymentId,
                    });
                    await reloadStudentData();
                  }}
                  onSimulateSubscription={async (pixId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await simulateStudentSubscriptionPix({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      pixId,
                    });
                    await reloadStudentData();
                  }}
                  onStartTrial={async () => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await startStudentTrial({
                      apiUrl: config.apiUrl,
                      token: session.token,
                    });
                    await reloadStudentData();
                  }}
                  onUpdateReferralPixKey={async (pixKey, pixKeyType) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await updateStudentReferralPixKey({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      pixKey,
                      pixKeyType,
                    });
                    await reloadStudentData();
                  }}
                  refreshing={refreshing}
                />
              ) : null}

              {routeTab === "gyms" && !webMode ? (
                <StudentGymsScreen
                  data={data}
                  initialGymId={requestedGymId}
                  onCancelMembership={async (membershipId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await cancelStudentMembership({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      membershipId,
                    });
                    await reloadStudentData();
                  }}
                  onChangePlan={async (membershipId, planId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    return changeStudentMembershipPlan({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      membershipId,
                      planId,
                    });
                  }}
                  onJoinGym={async (gymId, planId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    return joinStudentGym({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      gymId,
                      planId,
                    });
                  }}
                  onLoadGymProfile={async (gymId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    return fetchStudentGymProfile({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      gymId,
                    });
                  }}
                  onRefresh={handleRefresh}
                  onSimulatePayment={async (paymentId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await simulateStudentPayment({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      paymentId,
                    });
                    await reloadStudentData();
                  }}
                  refreshing={refreshing}
                />
              ) : null}

              {routeTab === "personals" && !webMode ? (
                <StudentPersonalsScreen
                  initialCouponId={requestedCouponId}
                  initialPersonalId={requestedPersonalId}
                  initialPlanId={requestedPlanId}
                  onCancelAssignment={async (assignmentId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await cancelStudentPersonalAssignment({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      assignmentId,
                    });
                    await reloadStudentData();
                  }}
                  onLoadAssigned={async () => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    return fetchStudentAssignedPersonals({
                      apiUrl: config.apiUrl,
                      token: session.token,
                    });
                  }}
                  onLoadDirectory={async ({ filter, lat, lng }) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    return fetchStudentPersonalDirectory({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      filter,
                      lat,
                      lng,
                    });
                  }}
                  onLoadProfile={async (personalId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    return fetchStudentPersonalProfile({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      personalId,
                    });
                  }}
                  onOpenGym={(gymId) =>
                    navigateToStudentTab("gyms", {
                      gymId,
                    })
                  }
                  onSimulatePayment={async (paymentId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    await simulateStudentPersonalPayment({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      paymentId,
                    });
                    await reloadStudentData();
                  }}
                  onSubscribe={async (personalId, planId, couponId) => {
                    if (!session.token) {
                      throw new Error("Sessao indisponivel.");
                    }

                    return subscribeStudentToPersonal({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      personalId,
                      planId,
                      couponId,
                    });
                  }}
                />
              ) : null}

              {routeTab === "education" && !webMode ? (
                <StudentEducationScreen />
              ) : null}

              {routeTab === "cardio" && !webMode ? (
                <StudentCardioScreen data={data} />
              ) : null}

              {routeTab === "profile" ? (
                <StudentProfileScreen
                  data={data}
                  isAdmin={session.user?.role === "ADMIN"}
                  onAddWeight={async (weight) => {
                    if (!session.token) {
                      return;
                    }

                    await addWeight({
                      apiUrl: config.apiUrl,
                      token: session.token,
                      weight,
                    });
                  }}
                  onLogout={handleLogout}
                  onNavigate={(tab) => navigateToStudentTab(tab)}
                  onRefresh={handleRefresh}
                  onSwitchToGym={handleSwitchToGym}
                  refreshing={refreshing}
                />
              ) : null}

              {((routeTab !== "home" &&
                routeTab !== "more" &&
                routeTab !== "profile" &&
                routeTab !== "learn" &&
                routeTab !== "diet" &&
                routeTab !== "payments" &&
                routeTab !== "gyms" &&
                routeTab !== "personals" &&
                routeTab !== "education" &&
                routeTab !== "cardio") ||
                webMode) ? (
                <StudentWebTabFallback params={params} tab={routeTab} />
              ) : null}
            </>
          ) : null}
        </View>

        <StudentBottomNav
          activeTab={activeBottomTab}
          onChange={(tab) => navigateToStudentTab(tab)}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  errorState: {
    alignItems: "stretch",
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderRadius: 24,
    borderWidth: 2,
    gap: spacing.md,
    margin: spacing.md,
    padding: spacing.lg,
  },
  errorTitle: {
    color: colors.foreground,
    fontSize: typography.heading.fontSize,
    fontWeight: "900",
    textAlign: "center",
  },
  errorDescription: {
    color: colors.foregroundMuted,
    fontSize: typography.body.fontSize,
    lineHeight: 22,
    textAlign: "center",
  },
});
