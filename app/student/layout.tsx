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
import { Suspense, useEffect, useState } from "react";
import { parseAsString, useQueryState } from "nuqs";

function StudentLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("home"));
  const [isChecking, setIsChecking] = useState(true);

  const isOnboarding = pathname.includes("/onboarding");

  const studentTabs: TabConfig[] = [
    { id: "home", icon: Home, label: "Início" },
    { id: "learn", icon: Dumbbell, label: "Treino" },
    { id: "diet", icon: UtensilsCrossed, label: "Dieta" },
    { id: "profile", icon: User, label: "Perfil" },
    { id: "more", icon: MoreHorizontal, label: "Mais" },
  ];

  useEffect(() => {
    const checkProfile = async () => {
      if (isOnboarding) {
        setIsChecking(false);
        return;
      }

      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          router.push("/auth/login");
          return;
        }

        const response = await fetch("/api/students/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setIsChecking(false);
          return;
        }

        const data = await response.json();
        if (!data.hasProfile) {
          router.push("/student/onboarding");
          return;
        }
      } catch (error) {
        console.error("Erro ao verificar perfil:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkProfile();
  }, [pathname, router, isOnboarding]);

  if (isOnboarding) {
    return <>{children}</>;
  }

  if (isChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-4 text-4xl">💪</div>
          <p className="text-gray-600">Carregando...</p>
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
        streak: useStudentStore.getState().progress.currentStreak,
        xp: useStudentStore.getState().progress.totalXP,
      }}
      shouldDisableSwipe={(path) =>
        path.includes("/workout") ||
        path.includes("/lesson") ||
        path.includes("/onboarding")
      }
      onTabChange={handleTabChange}
      additionalContent={<WorkoutModal />}
      scrollResetEnabled={!isOnboarding && !isChecking}
      className="bg-white"
    >
      {children}
    </AppLayout>
  );
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SwipeDirectionProvider>
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center">
            Carregando...
          </div>
        }
      >
        <StudentLayoutContent>{children}</StudentLayoutContent>
      </Suspense>
    </SwipeDirectionProvider>
  );
}
