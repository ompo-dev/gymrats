"use client";

import { AppHeader } from "@/components/app-header";
import { AppBottomNav } from "@/components/app-bottom-nav";
import {
  SwipeDirectionProvider,
  useSwipeDirection,
} from "@/contexts/swipe-direction";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  DollarSign,
  MoreHorizontal,
} from "lucide-react";
import { mockGymProfile } from "@/lib/gym-mock-data";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useSwipe } from "@/hooks/use-swipe";
import { parseAsString, useQueryState } from "nuqs";

function GymLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("dashboard")
  );
  const { setDirection } = useSwipeDirection();

  const gymTabs = [
    { id: "dashboard", icon: LayoutDashboard, label: "Início" },
    { id: "students", icon: Users, label: "Alunos" },
    { id: "equipment", icon: Dumbbell, label: "Equip." },
    { id: "financial", icon: DollarSign, label: "Finanças" },
    { id: "more", icon: MoreHorizontal, label: "Mais" },
  ];

  const activeTab = tab;

  // Se estiver em uma página de detalhes (via search params), não alterar o tab
  const [studentId] = useQueryState("studentId", parseAsString);
  const [equipmentId] = useQueryState("equipmentId", parseAsString);
  const isInDetailPage = !!studentId || !!equipmentId;

  const handleTabChange = async (newTab: string) => {
    // Determinar direção baseado na ordem das tabs
    const currentIndex = gymTabs.findIndex((t) => t.id === activeTab);
    const newIndex = gymTabs.findIndex((t) => t.id === newTab);

    if (newIndex > currentIndex) {
      setDirection("left");
    } else if (newIndex < currentIndex) {
      setDirection("right");
    }

    await setTab(newTab);
    router.push(`/gym?tab=${newTab}`);
    window.scrollTo({ top: 0, behavior: "smooth" });

    setTimeout(() => setDirection(null), 300);
  };

  // Funções para navegação por swipe
  const goToNextTab = async () => {
    setDirection("left");
    const currentIndex = gymTabs.findIndex((t) => t.id === activeTab);
    if (currentIndex < gymTabs.length - 1) {
      await handleTabChange(gymTabs[currentIndex + 1].id);
    }
    setTimeout(() => setDirection(null), 300);
  };

  const goToPreviousTab = async () => {
    setDirection("right");
    const currentIndex = gymTabs.findIndex((t) => t.id === activeTab);
    if (currentIndex > 0) {
      await handleTabChange(gymTabs[currentIndex - 1].id);
    }
    setTimeout(() => setDirection(null), 300);
  };

  // Hook de swipe
  const swipeHandlers = useSwipe({
    onSwipeLeft: isInDetailPage ? undefined : goToNextTab,
    onSwipeRight: isInDetailPage ? undefined : goToPreviousTab,
    threshold: 50,
  });

  return (
    <div
      className="h-screen flex flex-col bg-gray-50 overflow-hidden"
      {...(!isInDetailPage
        ? {
            onTouchStart: swipeHandlers.onTouchStart,
            onTouchMove: swipeHandlers.onTouchMove,
            onTouchEnd: swipeHandlers.onTouchEnd,
            onMouseDown: swipeHandlers.onMouseDown,
            onMouseMove: swipeHandlers.onMouseMove,
            onMouseUp: swipeHandlers.onMouseUp,
            onMouseLeave: swipeHandlers.onMouseUp,
          }
        : {})}
    >
      <AppHeader
        userType="gym"
        stats={{
          streak: mockGymProfile.gamification.currentStreak,
          xp: mockGymProfile.gamification.xp,
          level: mockGymProfile.gamification.level,
          ranking: mockGymProfile.gamification.ranking,
        }}
        showLogo={false}
      />

      <main className="flex-1 overflow-y-auto scrollbar-hide pb-20">
        {children}
      </main>

      <AppBottomNav
        userType="gym"
        activeTab={activeTab}
        tabs={gymTabs}
        onTabChange={handleTabChange}
      />
    </div>
  );
}

export default function GymLayout({ children }: { children: React.ReactNode }) {
  return (
    <SwipeDirectionProvider>
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center">
            Carregando...
          </div>
        }
      >
        <GymLayoutContent>{children}</GymLayoutContent>
      </Suspense>
    </SwipeDirectionProvider>
  );
}
