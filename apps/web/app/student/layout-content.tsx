"use client";

import {
  Dumbbell,
  Home,
  MoreHorizontal,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { LoadingScreen } from "@/components/organisms/loading-screen";
import {
  EditUnitModal,
  NutritionLibraryModal,
  TrainingLibraryModal,
} from "@/components/organisms/modals";
import { WorkoutModal } from "@/components/organisms/workout/workout-modal";
import {
  AppLayout,
  type TabConfig,
} from "@/components/templates/layouts/app-layout";
import { useModalState } from "@/hooks/use-modal-state";
import type { StudentData } from "@/lib/types/student-unified";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";

interface StudentLayoutContentProps {
  children: React.ReactNode;
  hasProfile: boolean;
  profileResolved: boolean;
  initialBootstrap?: Partial<StudentData> | null;
  initialProgress: {
    streak: number;
    xp: number;
  };
}

export function StudentLayoutContent({
  children,
  hasProfile,
  profileResolved,
  initialBootstrap,
  initialProgress,
}: StudentLayoutContentProps) {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const storeProgress = useStudentUnifiedStore(
    (state) => state.data.progress,
  ) as unknown as
    | import("@/lib/types").UserProgress
    | undefined;
  const hydrateInitial = useStudentUnifiedStore(
    (state) => state.hydrateInitial,
  );
  const loadWeeklyPlan = useStudentUnifiedStore(
    (state) => state.loadWeeklyPlan,
  );
  const editPlanModal = useModalState("edit-plan");
  const nutritionLibraryModal = useModalState("nutrition-library");
  const currentStreak = storeProgress?.currentStreak ?? initialProgress.streak;
  const currentXP = storeProgress?.totalXP ?? initialProgress.xp;
  const lastHydratedBootstrapRef = useRef<Partial<StudentData> | null>(null);
  const [_tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("home"),
  );
  const isOnboarding = pathname.includes("/onboarding");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (
      !initialBootstrap ||
      lastHydratedBootstrapRef.current === initialBootstrap
    ) {
      return;
    }

    lastHydratedBootstrapRef.current = initialBootstrap;
    hydrateInitial(initialBootstrap);
  }, [hydrateInitial, initialBootstrap]);

  useEffect(() => {
    if (isMounted && profileResolved && !hasProfile && !isOnboarding) {
      const timeoutId = setTimeout(() => {
        router.replace("/student/onboarding");
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isMounted, hasProfile, isOnboarding, profileResolved, router]);

  const studentTabs: TabConfig[] = [
    { id: "home", icon: Home, label: "Inicio" },
    { id: "learn", icon: Dumbbell, label: "Treino" },
    { id: "diet", icon: UtensilsCrossed, label: "Dieta" },
    { id: "profile", icon: User, label: "Perfil" },
    { id: "more", icon: MoreHorizontal, label: "Mais" },
  ];

  if (!isMounted) {
    return <LoadingScreen.Simple variant="student" />;
  }

  if (isOnboarding) {
    return <>{children}</>;
  }

  if (profileResolved && !hasProfile && !isOnboarding) {
    return (
      <LoadingScreen.Simple variant="student" message="Redirecionando..." />
    );
  }

  const handleTabChange = async (newTab: string) => {
    if (newTab === "home") {
      await setTab(null);
      return;
    }

    await setTab(newTab);
  };

  return (
    <AppLayout.Simple
      userType="student"
      tabs={studentTabs}
      defaultTab="home"
      basePath="/student"
      showLogo={true}
      stats={{
        streak: currentStreak,
        xp: currentXP,
      }}
      onTabChange={handleTabChange}
      additionalContent={
        <>
          <WorkoutModal.Simple />
          <EditUnitModal />
          <TrainingLibraryModal />
          {nutritionLibraryModal.isOpen && <NutritionLibraryModal />}
          {editPlanModal.isOpen && (
            <EditUnitModal
              isWeeklyPlanMode
              isOpen={editPlanModal.isOpen}
              onClose={editPlanModal.close}
              onPlanUpdated={() => loadWeeklyPlan(true)}
            />
          )}
        </>
      }
      scrollResetEnabled={!isOnboarding}
      className="bg-duo-bg"
    >
      {children}
    </AppLayout.Simple>
  );
}
