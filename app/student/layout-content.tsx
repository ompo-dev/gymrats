"use client";

import { WorkoutModal } from "@/components/workout-modal";
import { AppLayout, TabConfig } from "@/components/app-layout";
import { SwipeDirectionProvider } from "@/contexts/swipe-direction";
import {
  Home,
  Dumbbell,
  User,
  UtensilsCrossed,
  MoreHorizontal,
} from "lucide-react";
import { useStudentStore } from "@/stores";
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
  const pathname = usePathname();
  const router = useRouter();
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("home"));

  const isOnboarding = pathname.includes("/onboarding");

  const studentTabs: TabConfig[] = [
    { id: "home", icon: Home, label: "Início" },
    { id: "learn", icon: Dumbbell, label: "Treino" },
    { id: "diet", icon: UtensilsCrossed, label: "Dieta" },
    { id: "profile", icon: User, label: "Perfil" },
    { id: "more", icon: MoreHorizontal, label: "Mais" },
  ];

  if (isOnboarding) {
    return <>{children}</>;
  }

  if (!hasProfile && !isOnboarding) {
    router.push("/student/onboarding");
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-4 text-4xl">💪</div>
          <p className="text-gray-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

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
