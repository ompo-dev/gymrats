"use client";

import { useEffect, useState } from "react";
import { AppLayout, TabConfig } from "@/components/templates/layouts/app-layout";
import { WorkoutModal } from "@/components/organisms/workout/workout-modal";
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

  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("home"));

  const isOnboarding = pathname.includes("/onboarding");

  const studentTabs: TabConfig[] = [
    { id: "home", icon: Home, label: "Início" },
    { id: "learn", icon: Dumbbell, label: "Treino" },
    { id: "diet", icon: UtensilsCrossed, label: "Dieta" },
    { id: "profile", icon: User, label: "Perfil" },
    { id: "more", icon: MoreHorizontal, label: "Mais" },
  ];

  // Aguardar montagem no cliente antes de renderizar conteúdo que usa nuqs
  if (!isMounted) {
    return <LoadingScreen variant="student" />;
  }

  if (isOnboarding) {
    return <>{children}</>;
  }

  if (!hasProfile && !isOnboarding) {
    router.push("/student/onboarding");
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
        streak: initialProgress.streak,
        xp: initialProgress.xp,
      }}
      shouldDisableSwipe={(path) =>
        path.includes("/workout") ||
        path.includes("/lesson") ||
        path.includes("/onboarding")
      }
      onTabChange={handleTabChange}
      additionalContent={<WorkoutModal />}
      scrollResetEnabled={!isOnboarding}
      className="bg-white"
    >
      {children}
    </AppLayout>
  );
}
