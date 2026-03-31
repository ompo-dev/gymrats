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
import { useEffect, useState } from "react";
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
import { useStudent } from "@/hooks/use-student";
import { useStudentDefaultBootstrapBridge } from "@/hooks/use-student-bootstrap";

interface StudentLayoutContentProps {
  children: React.ReactNode;
  hasProfile: boolean;
  profileResolved: boolean;
  initialProgress: {
    streak: number;
    xp: number;
  };
}

export function StudentLayoutContent({
  children,
  hasProfile,
  profileResolved,
  initialProgress,
}: StudentLayoutContentProps) {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // TODOS OS HOOKS DEVEM VIR ANTES DE QUALQUER RETURN
  // Aguardar montagem no cliente antes de usar useQueryState
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Inicializar dados do student automaticamente quando o layout carregar
  // Não bloquear renderização - dados carregam em background
  useStudentDefaultBootstrapBridge({ enabled: false });

  // Buscar progresso do store para atualizar header dinamicamente
  const storeProgress = useStudent("progress") as unknown as
    | import("@/lib/types").UserProgress
    | undefined;
  const { loadWeeklyPlan } = useStudent("loaders");
  const editPlanModal = useModalState("edit-plan");
  const nutritionLibraryModal = useModalState("nutrition-library");
  const currentStreak = storeProgress?.currentStreak ?? initialProgress.streak;
  const currentXP = storeProgress?.totalXP ?? initialProgress.xp;

  const [_tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("home"),
  );

  const isOnboarding = pathname.includes("/onboarding");

  const studentTabs: TabConfig[] = [
    { id: "home", icon: Home, label: "Início" },
    { id: "learn", icon: Dumbbell, label: "Treino" },
    { id: "diet", icon: UtensilsCrossed, label: "Dieta" },
    { id: "profile", icon: User, label: "Perfil" },
    { id: "more", icon: MoreHorizontal, label: "Mais" },
  ];

  // Redirecionar para onboarding se não tiver perfil (dentro de useEffect para evitar erro de render)
  useEffect(() => {
    if (isMounted && profileResolved && !hasProfile && !isOnboarding) {
      // Usar replace em vez de push para evitar histórico de navegação
      // E adicionar um pequeno delay para evitar múltiplos redirecionamentos
      const timeoutId = setTimeout(() => {
        router.replace("/student/onboarding");
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isMounted, hasProfile, isOnboarding, profileResolved, router]);

  // Aguardar montagem no cliente antes de renderizar conteúdo que usa nuqs
  if (!isMounted) {
    return <LoadingScreen.Simple variant="student" />;
  }

  if (isOnboarding) {
    return <>{children}</>;
  }

  // Mostrar loading enquanto redireciona para onboarding
  if (profileResolved && !hasProfile && !isOnboarding) {
    return (
      <LoadingScreen.Simple variant="student" message="Redirecionando..." />
    );
  }

  // Handler para mudança de tabs
  const handleTabChange = async (newTab: string) => {
    if (newTab === "home") {
      await setTab(null);
    } else {
      await setTab(newTab);
    }
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
