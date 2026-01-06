"use client";

import { useEffect, useState } from "react";
import {
  AppLayout,
  TabConfig,
} from "@/components/templates/layouts/app-layout";
import { WorkoutModal } from "@/components/organisms/workout/workout-modal";
import { EditUnitModal } from "@/components/organisms/modals";
import { LoadingScreen } from "@/components/organisms/loading-screen";
import {
  Home,
  Dumbbell,
  User,
  UtensilsCrossed,
  MoreHorizontal,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useStudentInitializer } from "@/hooks/use-student-initializer";
import { useStudent } from "@/hooks/use-student";

interface StudentLayoutContentProps {
  children: React.ReactNode;
  hasProfile: boolean;
  initialProgress: {
    streak: number;
    xp: number;
  };
}

export function StudentLayoutContent({
  children,
  hasProfile,
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
  useStudentInitializer({
    autoLoad: true,
  });

  // Buscar progresso do store para atualizar header dinamicamente
  const { progress: storeProgress } = useStudent("progress");
  const currentStreak = storeProgress?.currentStreak ?? initialProgress.streak;
  const currentXP = storeProgress?.totalXP ?? initialProgress.xp;

  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("home"));

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
    if (isMounted && !hasProfile && !isOnboarding) {
      router.push("/student/onboarding");
    }
  }, [isMounted, hasProfile, isOnboarding, router]);

  // Aguardar montagem no cliente antes de renderizar conteúdo que usa nuqs
  if (!isMounted) {
    return <LoadingScreen variant="student" />;
  }

  if (isOnboarding) {
    return <>{children}</>;
  }

  // Mostrar loading enquanto redireciona para onboarding
  if (!hasProfile && !isOnboarding) {
    return <LoadingScreen variant="student" message="Redirecionando..." />;
  }

  // Handler para mudança de tabs
  const handleTabChange = async (newTab: string) => {
    if (newTab === "home") {
      await setTab(null);
      router.push("/student");
    } else {
      await setTab(newTab);
    }
  };

  return (
    <AppLayout
      userType="student"
      tabs={studentTabs}
      defaultTab="home"
      basePath="/student"
      showLogo={true}
      stats={{
        streak: currentStreak,
        xp: currentXP,
      }}
      shouldDisableSwipe={(path) =>
        path.includes("/workout") ||
        path.includes("/lesson") ||
        path.includes("/onboarding")
      }
      onTabChange={handleTabChange}
      additionalContent={
        <>
          <WorkoutModal />
          <EditUnitModal />
        </>
      }
      scrollResetEnabled={!isOnboarding}
      className="bg-white"
    >
      {children}
    </AppLayout>
  );
}
